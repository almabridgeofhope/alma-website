const Footer = () => {
  return (
    <footer className="bg-muted py-12">
      <div className="max-w-content mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Alma Bridge of Hope
            </h3>
            <p className="text-muted-foreground">
              Bridging hope across continents through sustainable community development.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Navigation</h4>
            <nav className="space-y-2">
              <a href="#about" className="block text-muted-foreground hover:text-primary transition-colors">
                About
              </a>
              <a href="#work" className="block text-muted-foreground hover:text-primary transition-colors">
                Our Work
              </a>
              <a href="#team" className="block text-muted-foreground hover:text-primary transition-colors">
                Team
              </a>
              <a href="#updates" className="block text-muted-foreground hover:text-primary transition-colors">
                Updates
              </a>
              <a href="#contact" className="block text-muted-foreground hover:text-primary transition-colors">
                Contact
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <nav className="space-y-2">
              <a href="#impressum" className="block text-muted-foreground hover:text-primary transition-colors">
                Impressum
              </a>
              <a href="#privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
          <p>&copy; 2024 Alma Bridge of Hope. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;