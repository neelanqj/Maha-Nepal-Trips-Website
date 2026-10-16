import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  HeroContent,
  DeepakBioContent,
  ContactDetailsContent,
  ViatorWidgetContent,
  SitePoliciesContent,
  FAQItem
} from '../types/index.ts';

interface ContentContextType {
  hero: HeroContent | null;
  bio: DeepakBioContent | null;
  contact: ContactDetailsContent | null;
  viatorWidget: ViatorWidgetContent | null;
  policies: SitePoliciesContent | null;
  faqs: FAQItem[];
  isLoading: boolean;
  refreshContent: () => Promise<void>;
  updateSection: (key: string, value: any) => Promise<boolean>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [bio, setBio] = useState<DeepakBioContent | null>(null);
  const [contact, setContact] = useState<ContactDetailsContent | null>(null);
  const [viatorWidget, setViatorWidget] = useState<ViatorWidgetContent | null>(null);
  const [policies, setPolicies] = useState<SitePoliciesContent | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshContent = async () => {
    try {
      const res = await fetch('/api/content/all');
      if (res.ok) {
        const data = await res.json();
        const c = data.content || {};
        if (c.hero) setHero(c.hero);
        if (c.deepak_bio) setBio(c.deepak_bio);
        if (c.contact_details) setContact(c.contact_details);
        if (c.viator_widget) setViatorWidget(c.viator_widget);
        if (c.policies) setPolicies(c.policies);
        if (c.faqs) setFaqs(c.faqs);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const updateSection = async (key: string, value: any): Promise<boolean> => {
    const token = localStorage.getItem('mnt_auth_token');
    try {
      const res = await fetch(`/api/content/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ value })
      });
      if (res.ok) {
        await refreshContent();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    refreshContent();
  }, []);

  return (
    <ContentContext.Provider
      value={{
        hero,
        bio,
        contact,
        viatorWidget,
        policies,
        faqs,
        isLoading,
        refreshContent,
        updateSection
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used within ContentProvider');
  return context;
}
