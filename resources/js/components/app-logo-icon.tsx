import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            {/* Bingkai Kotak Membulat */}
            <rect x="25" y="25" width="462" height="462" rx="90" ry="90" fill="none" stroke="#f17112" strokeWidth="36" />

            {/* Grafik Batang */}
            <g fill="#f17112">
                <rect x="110" y="210" width="52" height="170" rx="10" />
                <rect x="195" y="150" width="52" height="230" rx="10" />
                <rect x="280" y="190" width="52" height="190" rx="10" />
                <rect x="365" y="220" width="52" height="160" rx="10" />
            </g>

            {/* Garis Panah Naik Turun */}
            <path
                d="M 85 365 L 185 245 L 260 305 L 400 145 M 400 145 L 335 142 M 400 145 L 403 210"
                fill="none"
                stroke="#f17112"
                strokeWidth="32"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
