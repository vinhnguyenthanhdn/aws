import React from 'react';
import '../styles/Footer.css';

export const Footer: React.FC = () => {
    return (
        <footer className="app-footer">
            <div className="container">
                <div className="footer-content">
                    <p className="footer-text">
                        Made with ❤️ for AWS Certification Aspirants
                    </p>
                    <p className="footer-contact">
                        📧 Contact: <a href="mailto:vinh@example.com">vinh@example.com</a>
                    </p>
                </div>
            </div>
        </footer>
    );
};
