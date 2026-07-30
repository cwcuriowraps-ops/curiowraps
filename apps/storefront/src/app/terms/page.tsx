export const metadata = { title: "Terms & Conditions | Curio Wrap" };

export default function TermsPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 py-24 max-w-3xl sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif mb-12 text-text-primary text-center">Terms & Conditions</h1>
        <div className="prose prose-lg prose-pink mx-auto">
          <p className="text-sm tracking-wider uppercase text-text-secondary mb-8">Last updated: July 2026</p>
          
          <h2 className="text-2xl font-serif text-text-primary mt-8 mb-4">1. Agreement to Terms</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-6">By accessing our website, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          
          <h2 className="text-2xl font-serif text-text-primary mt-8 mb-4">2. Intellectual Property</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-6">The materials contained in this website are protected by applicable copyright and trademark law.</p>
          
          <h2 className="text-2xl font-serif text-text-primary mt-8 mb-4">3. Limitations</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-6">In no event shall Curio Wrap or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website.</p>
        </div>
      </div>
    </div>
  );
}