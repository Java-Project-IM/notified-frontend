import React from 'react'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export const Skeleton = ({ className = '', style }: SkeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-slate-700/40 rounded-md ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export default Skeleton
