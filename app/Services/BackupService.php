<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class BackupService
{
    protected string $backupDisk = 'local';
    protected string $backupDir = 'backups';

    public function __construct()
    {
        // Make sure the backups directory exists using Storage disk path
        $path = Storage::disk($this->backupDisk)->path($this->backupDir);
        if (!file_exists($path)) {
            mkdir($path, 0755, true);
        }
    }

    /**
     * Create a compressed database backup zip file
     */
    public function createBackup(): array
    {
        // Disable execution limits for heavy operations
        @set_time_limit(0);
        @ini_set('memory_limit', '512M');

        $timestamp = date('Y-m-d_H-i-s');
        $dbName = DB::getDatabaseName();
        $sqlFilename = "backup_{$dbName}_{$timestamp}.sql";
        $zipFilename = "backup_{$dbName}_{$timestamp}.zip";

        $sqlPath = Storage::disk($this->backupDisk)->path("backups/{$sqlFilename}");
        $zipPath = Storage::disk($this->backupDisk)->path("backups/{$zipFilename}");

        $file = fopen($sqlPath, 'w');
        if (!$file) {
            throw new \Exception("Cannot create backup file: {$sqlPath}");
        }

        // Header SQL
        fwrite($file, "-- Database Backup for `{$dbName}`\n");
        fwrite($file, "-- Generated on: " . date('Y-m-d H:i:s') . "\n");
        fwrite($file, "-- ======================================================\n\n");
        fwrite($file, "SET FOREIGN_KEY_CHECKS=0;\n\n");

        // Fetch all base tables in the active database
        $tables = DB::select("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");

        foreach ($tables as $table) {
            $tableName = array_values((array)$table)[0];

            // 1. Structure: SHOW CREATE TABLE
            $createStatement = DB::select("SHOW CREATE TABLE `{$tableName}`");
            if (!empty($createStatement)) {
                $createSql = array_values((array)$createStatement[0])[1];
                fwrite($file, "-- ------------------------------------------------------\n");
                fwrite($file, "-- Table structure for `{$tableName}`\n");
                fwrite($file, "-- ------------------------------------------------------\n");
                fwrite($file, "DROP TABLE IF EXISTS `{$tableName}`;\n");
                fwrite($file, $createSql . ";\n\n");
            }

            // 2. Data: stream rows in chunks to save memory
            fwrite($file, "-- ------------------------------------------------------\n");
            fwrite($file, "-- Data for table `{$tableName}`\n");
            fwrite($file, "-- ------------------------------------------------------\n");

            $count = DB::table($tableName)->count();
            if ($count > 0) {
                $offset = 0;
                $limit = 500;
                while ($offset < $count) {
                    $rows = DB::table($tableName)->offset($offset)->limit($limit)->get();
                    foreach ($rows as $row) {
                        $rowArray = (array)$row;
                        $columns = array_keys($rowArray);
                        $values = array_map(function($val) {
                            if (is_null($val)) {
                                return 'NULL';
                            }
                            // Escape character values safely
                            return "'" . addslashes($val) . "'";
                        }, array_values($rowArray));

                        $columnsSql = implode('`, `', $columns);
                        $valuesSql = implode(', ', $values);
                        fwrite($file, "INSERT INTO `{$tableName}` (`{$columnsSql}`) VALUES ({$valuesSql});\n");
                    }
                    $offset += $limit;
                }
            }
            fwrite($file, "\n\n");
        }

        // Footer SQL
        fwrite($file, "SET FOREIGN_KEY_CHECKS=1;\n");
        fclose($file);

        // Compress file using ZipArchive
        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
            $zip->addFile($sqlPath, $sqlFilename);
            $zip->close();
            
            // Delete the uncompressed SQL file
            if (file_exists($sqlPath)) {
                unlink($sqlPath);
            }
        } else {
            throw new \Exception("Cannot compress SQL file to ZIP archive");
        }

        return [
            'filename' => $zipFilename,
            'path' => $zipPath,
            'size' => filesize($zipPath)
        ];
    }

    /**
     * Restore the database from a compressed zip backup
     */
    public function restoreBackup(string $zipPath): bool
    {
        @set_time_limit(0);
        @ini_set('memory_limit', '512M');

        if (!file_exists($zipPath)) {
            throw new \Exception("Backup file does not exist: {$zipPath}");
        }

        $tempDir = Storage::disk($this->backupDisk)->path('backups/temp_restore_' . uniqid());
        if (!mkdir($tempDir)) {
            throw new \Exception("Cannot create temporary extraction directory");
        }

        try {
            // Extract the ZIP archive
            $zip = new \ZipArchive();
            if ($zip->open($zipPath) !== true) {
                throw new \Exception("Failed to open ZIP archive");
            }
            $zip->extractTo($tempDir);
            $zip->close();

            // Locate the extracted SQL file
            $files = scandir($tempDir);
            $sqlFilename = null;
            foreach ($files as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'sql') {
                    $sqlFilename = $file;
                    break;
                }
            }

            if (!$sqlFilename) {
                throw new \Exception("No SQL dump file found inside the ZIP archive");
            }

            $sqlPath = "{$tempDir}/{$sqlFilename}";

            // Start restore process:
            // Disable foreign key checks before drops
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Drop all active tables in the database
            $activeTables = DB::select("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
            foreach ($activeTables as $table) {
                $tableName = array_values((array)$table)[0];
                DB::statement("DROP TABLE IF EXISTS `{$tableName}`;");
            }

            // Read and run the SQL file line by line
            $templine = '';
            $handle = fopen($sqlPath, 'r');
            if ($handle) {
                while (($line = fgets($handle)) !== false) {
                    $trimmedLine = trim($line);
                    
                    // Skip comments and blank lines
                    if (empty($trimmedLine) || str_starts_with($trimmedLine, '--') || str_starts_with($trimmedLine, '#') || str_starts_with($trimmedLine, '/*')) {
                        continue;
                    }
                    
                    $templine .= $line;
                    
                    // Semicolon at the end marks the query completion
                    if (str_ends_with($trimmedLine, ';')) {
                        DB::unprepared($templine);
                        $templine = '';
                    }
                }
                fclose($handle);
            }

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            $success = true;
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            Log::error('Restore database failed: ' . $e->getMessage());
            $success = false;
            throw $e;
        } finally {
            // Clean up temporary files
            if (file_exists($tempDir)) {
                $this->recursiveDeleteDir($tempDir);
            }
        }

        return $success;
    }

    /**
     * Recursively delete directory
     */
    protected function recursiveDeleteDir(string $dirPath): void
    {
        if (!is_dir($dirPath)) {
            return;
        }
        $objects = scandir($dirPath);
        foreach ($objects as $object) {
            if ($object !== "." && $object !== "..") {
                if (is_dir($dirPath . "/" . $object)) {
                    $this->recursiveDeleteDir($dirPath . "/" . $object);
                } else {
                    unlink($dirPath . "/" . $object);
                }
            }
        }
        rmdir($dirPath);
    }
}
