import React from 'react';
import Layout from '../../components/layout/Layout';

const ProfilePage: React.FC = () => {
  return (
    <Layout>
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-center text-secondary-900 mb-8">
          个人中心
        </h1>
        <div className="text-center text-secondary-600">
          <p>个人中心页面即将到来...</p>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;