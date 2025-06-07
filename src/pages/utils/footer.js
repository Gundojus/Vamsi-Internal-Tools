import React from 'react';
import theme from "theme";
import { Theme, Text, Input, Box, Section, Hr } from "@quarkly/widgets";
const Footer = () => {
    return (
        <Theme theme={theme}>
            <footer style={footerStyle}>
                <p style={textStyle}>
                    Website by <b><i>@sreev</i></b> and <i><b>@gundojusohan</b></i>
                </p>
            </footer>
        </Theme>
    );
};

const footerStyle = {
    backgroundColor: '#f8f9fa',
    padding: '10px 20px',
    textAlign: 'center',
    borderTop: '1px solid #e7e7e7',
    position: 'fixed',
    bottom: '16px', // Ensures it stays no more than 20px from the bottom
    width: '100%',
};

const textStyle = {
    margin: 0,
    fontSize: '14px',
    color: '#6c757d',
};

export default Footer;
