import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-secondary-900 text-secondary-300 ${className}`}>
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-white">博客系统</span>
            </div>
            <p className="text-secondary-400 text-sm mb-4">
              一个现代化的博客平台，专注于优质内容分享和技术交流。
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-secondary-400 hover:text-primary-400 transition-colors duration-200"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a
                href="#"
                className="text-secondary-400 hover:text-primary-400 transition-colors duration-200"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a
                href="#"
                className="text-secondary-400 hover:text-primary-400 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  首页
                </Link>
              </li>
              <li>
                <Link
                  to="/articles"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  所有文章
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  文章分类
                </Link>
              </li>
              <li>
                <Link
                  to="/tags"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  标签云
                </Link>
              </li>
              <li>
                <Link
                  to="/archives"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  文章归档
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-4">热门分类</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/category/react"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  React
                </Link>
              </li>
              <li>
                <Link
                  to="/category/typescript"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  TypeScript
                </Link>
              </li>
              <li>
                <Link
                  to="/category/javascript"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  JavaScript
                </Link>
              </li>
              <li>
                <Link
                  to="/category/css"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  CSS
                </Link>
              </li>
              <li>
                <Link
                  to="/category/nodejs"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  Node.js
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-4">支持与帮助</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  关于我们
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  联系我们
                </Link>
              </li>
              <li>
                <Link
                  to="/help"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  使用帮助
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  隐私政策
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                >
                  服务条款
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-8 pt-8 border-t border-secondary-700">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-white font-semibold mb-2">订阅我们的新闻</h3>
              <p className="text-secondary-400 text-sm">
                第一时间获取最新的技术文章和博客更新
              </p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="输入您的邮箱地址"
                className="flex-1 md:w-64 px-4 py-2 bg-secondary-800 border border-secondary-600 rounded-l-md text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="px-6 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900">
                订阅
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-secondary-700 flex flex-col md:flex-row items-center justify-between">
          <div className="text-secondary-400 text-sm mb-4 md:mb-0">
            © {currentYear} 博客系统. 保留所有权利.
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-secondary-400">
              Built with ❤️ using React & TypeScript
            </span>
            <div className="flex items-center space-x-4">
              <Link
                to="/privacy"
                className="text-secondary-400 hover:text-primary-400 transition-colors duration-200"
              >
                隐私政策
              </Link>
              <Link
                to="/terms"
                className="text-secondary-400 hover:text-primary-400 transition-colors duration-200"
              >
                服务条款
              </Link>
              <Link
                to="/sitemap"
                className="text-secondary-400 hover:text-primary-400 transition-colors duration-200"
              >
                站点地图
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;