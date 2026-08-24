const fs = require('fs');
let code = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

if (!code.includes('WebcamModal')) {
  code = code.replace(
    "import { Tooltip } from './Tooltip';",
    "import { Tooltip } from './Tooltip';\nimport { WebcamModal } from './WebcamModal';"
  );
  
  code = code.replace(
    "const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);",
    "const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);\n  const [isWebcamModalOpen, setIsWebcamModalOpen] = useState(false);"
  );

  code = code.replace(
    "cameraInputRef.current?.click();\n                          setIsAttachmentMenuOpen(false);",
    "const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);\n                          if (isMobile) {\n                            cameraInputRef.current?.click();\n                          } else {\n                            setIsWebcamModalOpen(true);\n                          }\n                          setIsAttachmentMenuOpen(false);"
  );

  code = code.replace(
    "</Tooltip>\n\n                {/* Cancel generation icon button - Google Red */}",
    `</Tooltip>\n\n                {isWebcamModalOpen && (\n                  <WebcamModal \n                    onClose={() => setIsWebcamModalOpen(false)}\n                    onCapture={(dataUrl) => {\n                      setImagePreview(dataUrl);\n                      setIsWebcamModalOpen(false);\n                    }}\n                  />\n                )}\n\n                {/* Cancel generation icon button - Google Red */}`
  );

  fs.writeFileSync('src/components/MessageInput.tsx', code);
}
