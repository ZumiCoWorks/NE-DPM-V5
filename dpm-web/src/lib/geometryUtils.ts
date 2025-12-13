// Helper function to calculate distance from point to line segment
function distanceToSegment(
    point: { x: number; y: number },
    segStart: { x: number; y: number },
    segEnd: { x: number; y: number }
): number {
    const dx = segEnd.x - segStart.x;
    const dy = segEnd.y - segStart.y;

    if (dx === 0 && dy === 0) {
        // Segment is a point
        const pdx = point.x - segStart.x;
        const pdy = point.y - segStart.y;
        return Math.sqrt(pdx * pdx + pdy * pdy);
    }

    // Calculate projection of point onto line
    const t = Math.max(0, Math.min(1,
        ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / (dx * dx + dy * dy)
    ));

    const projX = segStart.x + t * dx;
    const projY = segStart.y + t * dy;

    const pdx = point.x - projX;
    const pdy = point.y - projY;

    return Math.sqrt(pdx * pdx + pdy * pdy);
}

export { distanceToSegment };
