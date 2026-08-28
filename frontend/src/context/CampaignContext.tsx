import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  system: string;
  masterId: string;
  bannerUrl?: string;
  status: string;
  master?: { id: string; username: string; avatarUrl?: string };
  members?: Array<{ userId?: string; user: { id: string; username: string; avatarUrl?: string } }>;
  _count?: {
    characters: number;
    monsters: number;
    items: number;
    locations: number;
    quests: number;
    npcs: number;
  };
}

export interface LiveHandout {
  type: string;
  payload: any;
  targetUserId?: string | null;
  targetUsername?: string | null;
  isPrivate?: boolean;
  senderName?: string;
  timestamp: string;
}

interface CampaignContextType {
  campaigns: Campaign[];
  activeCampaign: Campaign | null;
  loading: boolean;
  activeTab: string;
  liveHandout: LiveHandout | null;
  setActiveTab: (tab: string) => void;
  setActiveCampaign: (campaign: Campaign | null) => void;
  fetchCampaigns: () => Promise<void>;
  dismissHandout: () => void;
  broadcastHandout: (type: string, payload: any, targetUserId?: string | null, targetUsername?: string | null) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('story');
  const [liveHandout, setLiveHandout] = useState<LiveHandout | null>(null);

  const fetchCampaigns = async () => {
    if (!token) {
      setCampaigns([]);
      setActiveCampaign(null);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch<{ campaigns: Campaign[] }>('/campaigns');
      setCampaigns(res.campaigns);
      if (res.campaigns.length > 0 && !activeCampaign) {
        setActiveCampaign(res.campaigns[0]);
      }
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [token]);

  // Socket room joining & live broadcast listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeCampaign) return;

    socket.emit('join_campaign', activeCampaign.id);

    const handleHandout = (data: LiveHandout) => {
      console.log('[Socket] Received live handout:', data);
      setLiveHandout(data);
    };

    socket.on('handout_received', handleHandout);

    return () => {
      socket.emit('leave_campaign', activeCampaign.id);
      socket.off('handout_received', handleHandout);
    };
  }, [activeCampaign?.id]);

  const dismissHandout = () => {
    setLiveHandout(null);
  };

  const broadcastHandout = (
    type: string,
    payload: any,
    targetUserId?: string | null,
    targetUsername?: string | null
  ) => {
    const socket = getSocket();
    if (socket && activeCampaign) {
      socket.emit('live_broadcast', {
        campaignId: activeCampaign.id,
        targetUserId: targetUserId || null,
        targetUsername: targetUsername || null,
        type,
        payload
      });
    }
  };

  return (
    <CampaignContext.Provider value={{
      campaigns,
      activeCampaign,
      loading,
      activeTab,
      liveHandout,
      setActiveTab,
      setActiveCampaign,
      fetchCampaigns,
      dismissHandout,
      broadcastHandout
    }}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};
