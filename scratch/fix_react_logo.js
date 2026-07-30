const fs = require('fs');

const textBase64 = fs.readFileSync(__dirname + '/extracted_text.png').toString('base64');
const wcBase64 = fs.readFileSync(__dirname + '/extracted_wc.png').toString('base64');

const code = `import React from "react";

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
        className="w-full h-full block overflow-visible"
        viewBox="150 330 720 360"
        xmlns="http://www.w3.org/2000/svg"
      >
        <image href={wcDataUrl} x="0" y="0" width="1024" height="1024" opacity="0.95" />
        <image href={textDataUrl} x="0" y="0" width="1024" height="1024" />
      </svg>
    </div>
  );
}
`;

fs.writeFileSync('/Users/romit/Downloads/Dashboard/packages/ui/src/components/logo.tsx', code);
console.log('Fixed packages/ui/src/components/logo.tsx with actual base64 strings');
