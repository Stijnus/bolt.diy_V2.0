import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { EnhancedHeader } from './EnhancedHeader';
import { 
  ElectricHero,
  ElectricButton,
  ElectricCard,
  ElectricLoader,
  ElectricText,
  LightningLogo
} from './LightningEffects';

export default function EnhancedLandingPage() {
  return (
    <div className="flex flex-col h-full w-full">
      <EnhancedHeader />
      
      {/* Hero Section */}
      <ElectricHero
        title="BoltDIY"
        subtitle="⚡ Lightning-fast AI Development Platform"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ElectricButton size="lg" onClick={() => console.log('Start Building')}>
            Start Building ⚡
          </ElectricButton>
          <ElectricButton size="lg" variant="secondary">
            View Templates
          </ElectricButton>
        </div>
      </ElectricHero>
      
      {/* Features Section */}
      <section className="py-20 px-6 bg-bolt-elements-bg-depth-1">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <ElectricText>Power Up Your Development</ElectricText>
            </h2>
            <p className="text-bolt-elements-textSecondary text-lg max-w-2xl mx-auto">
              Harness the electrical power of AI to build, iterate, and deploy applications at lightning speed.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <ElectricCard hover className="text-center">
              <div className="mb-4">
                <LightningLogo size={40} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                <ElectricText>Lightning Fast</ElectricText>
              </h3>
              <p className="text-bolt-elements-textSecondary">
                Generate full-stack applications in seconds, not hours. Our AI understands your requirements instantly.
              </p>
            </ElectricCard>
            
            <ElectricCard hover className="text-center">
              <div className="mb-4 flex justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-bolt-elements-icon-primary">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="m2 17 10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="m2 12 10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                <ElectricText>Circuit Architecture</ElectricText>
              </h3>
              <p className="text-bolt-elements-textSecondary">
                Build with modular components that connect seamlessly, like electrical circuits powering your applications.
              </p>
            </ElectricCard>
            
            <ElectricCard hover className="text-center">
              <div className="mb-4 flex justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-bolt-elements-icon-primary">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                <ElectricText>High Voltage Performance</ElectricText>
              </h3>
              <p className="text-bolt-elements-textSecondary">
                Optimized for maximum performance and efficiency. Your applications run with electrical precision.
              </p>
            </ElectricCard>
          </div>
        </div>
      </section>
      
      {/* Live Demo Section */}
      <section className="py-20 px-6 bg-bolt-elements-bg-depth-2">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            <ElectricText>See the Spark in Action</ElectricText>
          </h2>
          
          {/* Chat Interface */}
          <div className="bg-bolt-elements-bg-depth-1 rounded-lg border border-bolt-elements-borderColor overflow-hidden">
            <div className="p-4 border-b border-bolt-elements-borderColor bg-bolt-elements-bg-depth-2">
              <div className="flex items-center gap-2">
                <LightningLogo size={20} />
                <span className="font-semibold">BoltDIY AI Assistant</span>
                <span className="px-2 py-1 bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent text-xs rounded-full">
                  LIVE
                </span>
              </div>
            </div>
            
            <div className="h-96">
              <ClientOnly fallback={<BaseChat />}>
                {() => <Chat />}
              </ClientOnly>
            </div>
          </div>
          
          <p className="mt-6 text-bolt-elements-textSecondary">
            Type your idea and watch BoltDIY generate a complete application with lightning speed ⚡
          </p>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-bolt-elements-bg-depth-1 to-bolt-elements-bg-depth-3">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <LightningLogo size={64} className="mx-auto mb-6" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <ElectricText>Ready to Get Charged Up?</ElectricText>
          </h2>
          
          <p className="text-xl text-bolt-elements-textSecondary mb-8">
            Join thousands of developers who are building at the speed of lightning with BoltDIY.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ElectricButton size="lg">
              Start Building Now ⚡
            </ElectricButton>
            <ElectricButton size="lg" variant="secondary">
              Explore Examples
            </ElectricButton>
          </div>
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
            <div className="text-center">
              <div className="text-2xl font-bold text-bolt-elements-icon-primary">1M+</div>
              <div className="text-sm text-bolt-elements-textSecondary">Lines Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-bolt-elements-icon-primary">50K+</div>
              <div className="text-sm text-bolt-elements-textSecondary">Apps Built</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-bolt-elements-icon-primary">10K+</div>
              <div className="text-sm text-bolt-elements-textSecondary">Developers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-bolt-elements-icon-primary">99.9%</div>
              <div className="text-sm text-bolt-elements-textSecondary">Uptime</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
