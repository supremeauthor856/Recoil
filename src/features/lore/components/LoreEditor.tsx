import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from 'lucide-react'

interface LoreEditorProps {
  initialContent: string
  onChange: (html: string) => void
  placeholder?: string
}

export const LoreEditor: React.FC<LoreEditorProps> = ({
  initialContent,
  onChange,
  placeholder = 'Begin documenting this aspect of your lore...',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor: activeEditor }) => {
      const html = activeEditor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm prose-invert focus:outline-none min-h-[300px] max-h-[600px] overflow-y-auto px-4 py-3 text-[13px] text-[var(--color-text-primary)] leading-relaxed bg-[var(--color-bg-subtle)]/30 rounded-b-xl',
      },
    },
  })

  // Synchronize initialContent when it changes externally
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent)
    }
  }, [initialContent, editor])

  if (!editor) {
    return (
      <div className="w-full border border-[var(--color-border-subtle)] rounded-xl h-[350px] flex items-center justify-center text-[12px] text-[var(--color-text-muted)] animate-pulse bg-[var(--color-bg-subtle)]/20">
        Loading editor...
      </div>
    )
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run()
  const toggleItalic = () => editor.chain().focus().toggleItalic().run()
  const toggleStrike = () => editor.chain().focus().toggleStrike().run()
  const toggleCode = () => editor.chain().focus().toggleCode().run()
  const toggleHeading1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run()
  const toggleHeading2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run()
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run()
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run()
  const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run()
  const undo = () => editor.chain().focus().undo().run()
  const redo = () => editor.chain().focus().redo().run()

  return (
    <div className="flex flex-col w-full border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-bg-elevated)] overflow-hidden shadow-sm focus-within:border-[var(--color-accent-primary)]/80 transition-colors">
      {/* Rich Editor Toolbar */}
      <div className="flex items-center flex-wrap gap-1 p-2 bg-[var(--color-bg-subtle)] border-b border-[var(--color-border-subtle)]">
        <button
          type="button"
          onClick={toggleBold}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('bold')
              ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)] font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={toggleItalic}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('italic')
              ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={toggleStrike}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('strike')
              ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={toggleCode}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('code')
              ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)] font-mono'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
          title="Code Block"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-[var(--color-border-subtle)] mx-1" />

        <button
          type="button"
          onClick={toggleHeading1}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)] font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={toggleHeading2}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)] font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-[var(--color-border-subtle)] mx-1" />

        <button
          type="button"
          onClick={toggleBulletList}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('bulletList')
              ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={toggleOrderedList}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('orderedList')
              ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
          title="Ordered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={toggleBlockquote}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('blockquote')
              ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={undo}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={redo}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} className="scrollbar-custom" />
    </div>
  )
}
export default LoreEditor
