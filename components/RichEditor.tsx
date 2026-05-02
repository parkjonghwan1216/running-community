'use client';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`re-tb__btn${active ? ' is-active' : ''}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('링크 URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const onPickImage = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(
          res.status === 413
            ? '파일이 너무 큽니다 (최대 5MB)'
            : res.status === 415
              ? '지원하지 않는 형식입니다 (JPG/PNG/GIF/WEBP)'
              : `업로드 실패: ${j.error ?? res.status}`,
        );
        return;
      }
      const { url } = (await res.json()) as { url: string };
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="re-tb">
      <ToolbarButton
        title="굵게 (Ctrl+B)"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        title="기울임 (Ctrl+I)"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        title="취소선"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </ToolbarButton>
      <span className="re-tb__sep" />
      <ToolbarButton
        title="제목 1"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        title="제목 2"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H2
      </ToolbarButton>
      <span className="re-tb__sep" />
      <ToolbarButton
        title="글머리 기호"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        title="번호 매기기"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        title="인용"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        title="코드 블록"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        {'</>'}
      </ToolbarButton>
      <span className="re-tb__sep" />
      <ToolbarButton title="링크" active={editor.isActive('link')} onClick={setLink}>
        🔗
      </ToolbarButton>
      <ToolbarButton title={uploading ? '업로드 중…' : '이미지'} onClick={onPickImage}>
        {uploading ? '⏳' : '🖼'}
      </ToolbarButton>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      <ToolbarButton
        title="구분선"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        ―
      </ToolbarButton>
      <span className="re-tb__sep" />
      <ToolbarButton title="실행 취소 (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolbarButton>
      <ToolbarButton title="다시 실행 (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolbarButton>
      <span className="re-tb__sep" />
      <ToolbarButton
        title="서식 지우기"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
      >
        ✕
      </ToolbarButton>
    </div>
  );
}

export default function RichEditor({ value, onChange, placeholder, minHeight = 280 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Image.configure({ HTMLAttributes: { loading: 'lazy' } }),
      Placeholder.configure({ placeholder: placeholder ?? '내용을 입력하세요…' }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 're-content rich-content',
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) {
    return (
      <div className="re-shell" style={{ minHeight: minHeight + 60 }}>
        <div className="re-tb" style={{ height: 44 }} />
        <div style={{ padding: 14, color: 'var(--text-soft)' }}>에디터 로딩 중…</div>
      </div>
    );
  }

  return (
    <div className="re-shell">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
