const fs = require('fs');

const textBase64 = fs.readFileSync(__dirname + '/extracted_text.png').toString('base64');
const wcBase64 = fs.readFileSync(__dirname + '/extracted_wc.png').toString('base64');

// 1. Root logo.html
const logoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curio Wraps Logo</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f4f3f3;
      font-family: sans-serif;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    .logo-container {
      position: relative;
      width: 750px;
      height: 750px;
      background-color: #f4f3f3;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  </style>
</head>
<body>

  <div class="logo-container" id="logoContainer">
    <svg class="logo-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <!-- Watercolor Swatch & Splatters -->
      <image href="data:image/png;base64,${wcBase64}" x="0" y="0" width="1024" height="1024" opacity="0.96" />
      <!-- Exact Calligraphy & Subtext -->
      <image href="data:image/png;base64,${textBase64}" x="0" y="0" width="1024" height="1024" />
    </svg>
  </div>

  <script>
    // Smooth JS load & scale animation
    document.addEventListener("DOMContentLoaded", () => {
      const container = document.getElementById("logoContainer");
      container.style.opacity = "0";
      container.style.transform = "scale(0.985)";
      container.style.transition = "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)";
      
      requestAnimationFrame(() => {
        container.style.opacity = "1";
        container.style.transform = "scale(1)";
      });
    });
  </script>
</body>
</html>
`;

fs.writeFileSync('/Users/romit/Downloads/Dashboard/logo.html', logoHtml);
fs.writeFileSync('/Users/romit/Downloads/Dashboard/apps/storefront/public/logo.html', logoHtml);

// 2. React Logo Component in packages/ui/src/components/logo.tsx
const logoReactComponent = `import React from "react";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const textDataUrl = "data:image/png;base64,${textBase64}";
const wcDataUrl = "data:image/png;base64,${wcBase64}";

export function Logo({ size = 60, className = "", style, ...props }: LogoProps) {
  const height = size;
  const width = size * 2.33;

  return (
    <div
      className={\`relative flex items-center justify-center shrink-0 select-none \${className}\`}
      style={{ width, height, ...style }}
      {...props}
    >
      <svg
        className="w-full h-full block"
        viewBox="140 320 744 380"
        xmlns="http://www.w3.org/2000/svg"
      >
        <image href={wcDataUrl} x="0" y="0" width="1024" height="1024" opacity="0.96" />
        <image href={textDataUrl} x="0" y="0" width="1024" height="1024" />
      </svg>
    </div>
  );
}
`;

fs.writeFileSync('/Users/romit/Downloads/Dashboard/packages/ui/src/components/logo.tsx', logoReactComponent);

console.log('Successfully updated logo.html and Logo component with 100% exact reference design');
