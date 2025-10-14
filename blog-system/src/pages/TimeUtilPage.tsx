import React from 'react';
import Layout from '../../components/layout/Layout';
import CurrentTime from '../../components/ui/CurrentTime';

/**
 * 时间工具页面
 * 显示当前时间的多种格式
 */
const TimeUtilPage: React.FC = () => {
  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-secondary-900 mb-8">
            时间工具
          </h1>
          
          <div className="space-y-6">
            {/* 完整时间显示 */}
            <div className="card">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                完整时间
              </h2>
              <div className="bg-secondary-50 p-4 rounded-lg">
                <CurrentTime 
                  format="full" 
                  className="text-lg justify-center"
                />
              </div>
            </div>

            {/* 仅显示时间 */}
            <div className="card">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                当前时间
              </h2>
              <div className="bg-secondary-50 p-4 rounded-lg">
                <CurrentTime 
                  format="time" 
                  className="text-lg justify-center"
                />
              </div>
            </div>

            {/* 仅显示日期 */}
            <div className="card">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                当前日期
              </h2>
              <div className="bg-secondary-50 p-4 rounded-lg">
                <CurrentTime 
                  format="date" 
                  className="text-lg justify-center"
                />
              </div>
            </div>

            {/* 时间工具说明 */}
            <div className="card">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                功能说明
              </h2>
              <div className="space-y-2 text-secondary-600">
                <p>• 实时显示当前时间，每秒自动更新</p>
                <p>• 支持多种时间格式显示</p>
                <p>• 使用中国时区（Asia/Shanghai）</p>
                <p>• 响应式设计，适配各种设备</p>
              </div>
            </div>

            {/* 技术信息 */}
            <div className="card bg-blue-50">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                技术实现
              </h2>
              <div className="space-y-2 text-blue-700 text-sm">
                <p><strong>框架：</strong>React + TypeScript</p>
                <p><strong>更新机制：</strong>setInterval 定时器</p>
                <p><strong>时间格式化：</strong>Intl.DateTimeFormat API</p>
                <p><strong>样式：</strong>Tailwind CSS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TimeUtilPage;