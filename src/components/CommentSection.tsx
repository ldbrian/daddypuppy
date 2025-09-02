import React, { useState } from 'react';
import { Role } from '../types/Role';
import { Comment } from '../types/Comment';

interface CommentSectionProps {
  memoryId: string;
  comments: Comment[];
  onAddComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  memoryId,
  comments,
  onAddComment
}) => {
  const [content, setContent] = useState('');
  const [role, setRole] = useState<Role>(Role.DADDY);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddComment({
      content,
      memoryId,
      role
    });
    setContent('');
  };

  return (
    <div className="comment-section">
      <div className="comments-list">
        {comments.map(comment => (
          <div key={comment.id} className="comment">
            <div className="comment-header">
              <span className="role">{comment.role}</span>
              <span className="date">{comment.createdAt.toLocaleDateString()}</span>
            </div>
            <p>{comment.content}</p>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <select value={role} onChange={e => setRole(e.target.value as Role)}>
          <option value={Role.DADDY}>Daddy</option>
          <option value={Role.PUPPY}>Puppy</option>
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
