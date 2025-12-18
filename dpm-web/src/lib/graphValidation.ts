import { GraphNode, GraphSegment, findShortestNodePath } from './pathfinding';

export interface ValidationResult {
    isValid: boolean;
    orphanNodes: GraphNode[];
    unreachablePairs: Array<{ from: string; to: string }>;
    totalNodes: number;
    totalSegments: number;
    connectedComponents: number;
}

/**
 * Validates graph connectivity by checking if all nodes can reach each other
 * Returns orphan nodes and unreachable node pairs
 */
export function validateGraphConnectivity(
    nodes: GraphNode[],
    segments: GraphSegment[]
): ValidationResult {
    const orphanNodes: GraphNode[] = [];
    const unreachablePairs: Array<{ from: string; to: string }> = [];

    if (nodes.length === 0) {
        return {
            isValid: true,
            orphanNodes,
            unreachablePairs,
            totalNodes: 0,
            totalSegments: 0,
            connectedComponents: 0
        };
    }

    if (nodes.length === 1) {
        return {
            isValid: true,
            orphanNodes: [],
            unreachablePairs: [],
            totalNodes: 1,
            totalSegments: segments.length,
            connectedComponents: 1
        };
    }

    // Test each node can reach at least one other node
    for (const startNode of nodes) {
        let canReachAny = false;

        for (const endNode of nodes) {
            if (startNode.id === endNode.id) continue;

            const path = findShortestNodePath(nodes, segments, startNode.id, endNode.id);

            if (path.length > 0) {
                canReachAny = true;
                break; // Found at least one reachable node
            }
        }

        if (!canReachAny) {
            orphanNodes.push(startNode);
        }
    }

    // Find all unreachable pairs (for detailed reporting)
    if (orphanNodes.length === 0 && nodes.length <= 20) {
        // Only check all pairs for small graphs (performance)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const path = findShortestNodePath(nodes, segments, nodes[i].id, nodes[j].id);
                if (path.length === 0) {
                    unreachablePairs.push({
                        from: nodes[i].name || nodes[i].id,
                        to: nodes[j].name || nodes[j].id
                    });
                }
            }
        }
    }

    // Count connected components (simplified)
    const connectedComponents = orphanNodes.length > 0 ? orphanNodes.length + 1 : 1;

    return {
        isValid: orphanNodes.length === 0,
        orphanNodes,
        unreachablePairs,
        totalNodes: nodes.length,
        totalSegments: segments.length,
        connectedComponents
    };
}

/**
 * Quick validation - just checks if any orphan nodes exist
 */
export function hasOrphanNodes(nodes: GraphNode[], segments: GraphSegment[]): boolean {
    if (nodes.length <= 1) return false;

    for (const node of nodes) {
        let hasConnection = false;

        for (const segment of segments) {
            if (segment.start_node_id === node.id || segment.end_node_id === node.id) {
                hasConnection = true;
                break;
            }
        }

        if (!hasConnection) {
            return true; // Found orphan
        }
    }

    return false;
}
