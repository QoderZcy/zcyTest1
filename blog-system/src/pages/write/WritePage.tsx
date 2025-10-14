import React from 'react';
import Layout from '../../components/layout/Layout';

const WritePage: React.FC = () => {
  return (
    <Layout>
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-center text-secondary-900 mb-8">
          写文章
        </h1>
        <div className="text-center text-secondary-600">
          <p>写文章页面即将到来...</p>
        </div>
      </div>
    </Layout>
  );
};

export default WritePage;