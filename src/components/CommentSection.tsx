import React, { useState } from 'react';
import { Identity } from '../../lib/types'; // 更改导入路径和类型
import { Comment } from '../../lib/types'; // 更改导入路径

interface CommentSectionProps {
  memoryId: string;
  comments: Comment[]; // 更新类型引用
  onAddComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  memoryId,
  comments,
  onAddComment
}) => {
  const [content, setContent] = useState('');
  const [identity, setIdentity] = useState<Identity>('daddy'); // 更改状态类型和名称

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddComment({
      text: content, // 更改字段名content为text
      identity // 更改字段名role为identity
    });
    setContent('');
  };

  return (
    <div className="comment-section">
      <div className="comments-list">
        {comments.map(comment => (
          <div key={comment.id} className="comment">
            <div className="comment-header">
              <span className="role">{comment.identity}</span> {/* 更改字段名 */}
              <span className="date">{new Date(comment.createdAt).toLocaleDateString()}</span> {/* 修复日期显示 */}
            </div>
            <p>{comment.text}</p> {/* 更改字段名content为text */}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <select value={identity} onChange={e => setIdentity(e.target.value as Identity)}> {/* 更改状态变量名 */}
          <option value="daddy">Daddy</option>
          <option value="puppy">Puppy</option>
        </select>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="添加评论..."
        />
        <button type="submit">发表评论</button>
      </form>
    </div>
  );
};