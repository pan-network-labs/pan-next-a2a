import "@rainbow-me/rainbowkit/styles.css";
import "@scaffold-ui/components/styles.css";
import Script from "next/script";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { LanguageProvider } from "~~/utils/i18n/LanguageContext";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Scaffold-ETH 2 App",
  description: "Built with 🏗 Scaffold-ETH 2",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <Script
          id="ethereum-error-handler"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // 处理 window.ethereum 重定义错误
              // 某些钱包扩展或第三方库（如 evmAsk.js）可能会尝试重新定义 ethereum 属性
              (function() {
                // 监听全局错误，捕获 ethereum 重定义错误
                const originalErrorHandler = window.onerror;
                window.onerror = function(message, source, lineno, colno, error) {
                  if (typeof message === 'string' && message.includes('Cannot redefine property: ethereum')) {
                    // 静默处理这个错误，不显示在控制台
                    return true;
                  }
                  // 其他错误正常处理
                  if (originalErrorHandler) {
                    return originalErrorHandler.call(this, message, source, lineno, colno, error);
                  }
                  return false;
                };
                
                // 监听未捕获的错误
                window.addEventListener('error', function(event) {
                  if (event.message && event.message.includes('Cannot redefine property: ethereum')) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                  }
                }, true);
              })();
            `,
          }}
        />
        <ThemeProvider forcedTheme="dark">
          <LanguageProvider>
            <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
