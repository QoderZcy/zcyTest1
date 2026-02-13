import React from 'react';
import { useParams } from 'react-router-dom';

const UserBlog: React.FC = () => {
  const { username } = useParams<{ username: string }>();

  return (
    <div className="user-blog">
      <h1>{username} 的博客</h1>
      <p>此组件将在后续任务中完善...</p>
    </div>
  );
};

export default UserBlog;