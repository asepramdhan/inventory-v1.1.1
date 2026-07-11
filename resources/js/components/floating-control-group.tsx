import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { NetworkStatus } from '@/components/network-status';
import { Button } from '@/components/ui/button';

export function FloatingControlGroup() {
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowBackToTop(true);
            } else {
                setShowBackToTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-[45] flex flex-col-reverse items-center gap-2 select-none pointer-events-auto">
            {/* Network Status Widget */}
            <div className="shadow-lg rounded-full">
                <NetworkStatus />
            </div>

            {/* Back to Top Button */}
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={scrollToTop}
                className={`h-9 w-9 rounded-full shadow-lg border border-border/80 bg-background/95 backdrop-blur-md transition-all duration-300 hover:bg-accent active:scale-95 ${
                    showBackToTop 
                        ? 'opacity-100 translate-y-0 visible scale-100' 
                        : 'opacity-0 translate-y-4 invisible scale-75 pointer-events-none'
                }`}
                title="Kembali ke Atas"
            >
                <ArrowUp className="h-4 w-4" />
            </Button>
        </div>
    );
}
