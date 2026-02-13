import React from 'react';
import { useParams } from 'react-router-dom';

const CategoryBlog: React.FC = () => {
  const { name } = useParams<{ name: string }>();

  return (
    <div className="category-blog">
      <h1>分类: {name}</h1>
      <p>此组件将在后续任务中完善...</p>
    </div>
  );
};

export default CategoryBlog;