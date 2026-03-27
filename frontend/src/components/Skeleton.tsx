import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    className?: string;
    style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    variant = 'rectangular',
    className = '',
    style = {}
}) => {
    const skeletonStyle = {
        width,
        height,
        ...style
    };

    return (
        <div
            className={`skeleton skeleton-${variant} ${className}`}
            style={skeletonStyle}
        />
    );
};

export default Skeleton;

// Specialized Skeleton Variants for common UI patterns
export const CardSkeleton = () => (
    <div className="neo-card skeleton-card">
        <Skeleton variant="rectangular" height={150} className="mb-4" />
        <Skeleton variant="text" width="60%" height={24} className="mb-2" />
        <Skeleton variant="text" width="40%" height={16} className="mb-4" />
        <div className="flex justify-between mt-auto">
            <Skeleton variant="rounded" width={80} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
        </div>
    </div>
);

export const TableRowSkeleton = () => (
    <div className="skeleton-table-row">
        <Skeleton variant="rectangular" width="20%" height={20} />
        <Skeleton variant="rectangular" width="30%" height={20} />
        <Skeleton variant="rectangular" width="15%" height={20} />
        <Skeleton variant="rectangular" width="15%" height={20} />
        <Skeleton variant="rectangular" width="10%" height={20} />
    </div>
);

export const DashboardStatsSkeleton = () => (
    <div className="stats-grid">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card neo-card">
                <Skeleton variant="circular" width={40} height={40} className="mb-3" />
                <Skeleton variant="text" width="50%" height={32} className="mb-1" />
                <Skeleton variant="text" width="30%" height={16} />
            </div>
        ))}
    </div>
);
