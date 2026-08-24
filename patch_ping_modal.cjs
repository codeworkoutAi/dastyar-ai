const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

const testConnectionFunc = `
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const handleTestConnection = async (provider: ApiProvider) => {
    setTesting(true);
    setTestResult(null);
    try {
      const configObj = tempConfig[provider] || {};
      
      const res = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          customBaseUrl: configObj.baseUrl,
          customApiKey: configObj.apiKey,
          customHeaders: configObj.customHeaders,
          modelName: configObj.modelName
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: 'اتصال با موفقیت برقرار شد',
          latencyMs: data.latencyMs
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'خطا در اتصال'
        });
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: 'خطا در برقراری ارتباط با سرور'
      });
    } finally {
      setTesting(false);
    }
  };
`;

if (!content.includes('handleTestConnection')) {
  content = content.replace(/const handleSave = \(\) => \{/, testConnectionFunc + '\n  const handleSave = () => {');
}

const testButtonUI = `
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleTestConnection(activeTab)}
                  disabled={testing}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center justify-center gap-2"
                >
                  {testing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
                      در حال بررسی ارتباط...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      تست اتصال
                    </>
                  )}
                </button>
                {testResult && (
                  <div className={"mt-3 p-3 rounded-lg text-sm flex items-start gap-2 " + (testResult.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20")}>
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">
                      {testResult.success ? \`\${testResult.message} - \${testResult.latencyMs} میلی‌ثانیه\` : \`خطا در اتصال: \${testResult.message}\`}
                    </span>
                  </div>
                )}
              </div>
`;

content = content.replace(/(placeholder="gemini-2\.5-flash"\s*\/>\s*<\/div>\s*<\/div>\s*)(<\/div>)/g, "$1" + testButtonUI + "$2");
content = content.replace(/(placeholder="gpt-4o-mini"\s*\/>\s*<\/div>\s*<\/div>\s*)(<\/div>)/g, "$1" + testButtonUI + "$2");
content = content.replace(/(placeholder="claude-3-5-sonnet"\s*\/>\s*<\/div>\s*<\/div>\s*)(<\/div>)/g, "$1" + testButtonUI + "$2");
content = content.replace(/(placeholder='\{"HTTP-Referer": "https:\/\/myapp\.com"\}'\s*\/>\s*<\/div>\s*)(<\/div>)/g, "$1" + testButtonUI + "$2");

// Fix globe import
if (!content.includes('Globe')) {
  content = content.replace(/import {([^}]*)} from 'lucide-react';/, (match, p1) => {
    return "import { Globe, " + p1 + "} from 'lucide-react';";
  });
}

fs.writeFileSync('src/components/SettingsModal.tsx', content);
