import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getPublicCircuits, fetchGitHubRepoContents, fetchContent } from '../../api';
import HeroSection from './HeroSection';
import WhyZkSection from './WhyZkSection';
import HowItWorksSection from './HowItWorksSection';
import TemplatesSection from './TemplatesSection';
import CommunityCircuitsSection from './CommunityCircuitsSection';
import CtaSection from './CtaSection';

interface PlatformStats {
  total_proofs: number;
  active_circuits: number;
  verified_proofs: number;
  deployments: number;
}

interface FeaturedCircuit {
  id: number;
  hash: string;
  name: string | null;
  description: string | null;
  code: string | null;
  created_by: string | null;
  is_public: boolean | null;
  deployed_address: string | null;
  input_signals: string[] | null;
  input_descriptions: Record<string, string> | null;
}

interface TemplateCircuit {
  path: string;
  name: string;
  description?: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [featured, setFeatured] = useState<FeaturedCircuit[]>([]);
  const [templates, setTemplates] = useState<TemplateCircuit[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, publicData, templateData] = await Promise.allSettled([
          getStats(),
          getPublicCircuits(),
          fetchGitHubRepoContents(),
        ]);
        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (publicData.status === 'fulfilled') setFeatured(Array.isArray(publicData.value) ? publicData.value : []);
        if (templateData.status === 'fulfilled') {
          const all = Array.isArray(templateData.value) ? templateData.value : [];
          const withDesc = all.filter((t: TemplateCircuit) => t.description);
          const rest = all.filter((t: TemplateCircuit) => !t.description);
          setTemplates([...withDesc, ...rest].slice(0, 3));
        }
      } catch {
        // Non-critical
      }
    };
    load();
  }, []);

  const handleUseTemplate = async (template: TemplateCircuit) => {
    try {
      setLoadingTemplate(template.path);
      const content = await fetchContent(template.path);
      navigate('/templates/upload', {
        state: { circuitContent: typeof content === 'string' ? content : String(content ?? ''), fileName: template.name, description: template.description },
      });
    } catch {
      navigate(`/templates/${encodeURI(template.path)}`);
    } finally {
      setLoadingTemplate(null);
    }
  };

  return (
    <div className="min-h-screen">
      <HeroSection stats={stats} />
      <WhyZkSection />
      <HowItWorksSection />
      <TemplatesSection
        templates={templates}
        loadingTemplate={loadingTemplate}
        onUseTemplate={handleUseTemplate}
      />
      <CommunityCircuitsSection featured={featured} />
      <CtaSection />
    </div>
  );
};

export default Home;
