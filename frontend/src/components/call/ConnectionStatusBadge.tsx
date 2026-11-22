import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Badge } from '../common/Badge';

export type PeerConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'disconnected';

interface ConnectionStatusBadgeProps {
  status: PeerConnectionStatus;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'connected':
      return (
        <Badge tone="success" icon={<Wifi className="size-3.5" />}>
          Connected
        </Badge>
      );
    case 'connecting':
      return (
        <Badge tone="warning" icon={<RefreshCw className="size-3.5 animate-spin" />}>
          Connecting
        </Badge>
      );
    case 'reconnecting':
      return (
        <Badge tone="warning" icon={<RefreshCw className="size-3.5 animate-spin" />}>
          Reconnecting...
        </Badge>
      );
    case 'failed':
      return (
        <Badge tone="danger" icon={<WifiOff className="size-3.5" />}>
          Call Failed
        </Badge>
      );
    case 'disconnected':
    default:
      return (
        <Badge tone="neutral" icon={<WifiOff className="size-3.5" />}>
          Disconnected
        </Badge>
      );
  }
};
