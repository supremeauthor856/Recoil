import React from 'react'
import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) return null

  const tools = [
    {
      id: 'undo',
      icon: <Undo className="h-4 w-4" />,
      action: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().undo(),
      active: false,
      title: 'Undo',
    },
    {
      id: 'redo',
      icon: <Redo className="h-4 w-4" />,
      action: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().redo(),
      active: false,
      title: 'Redo',
    },
    { divider: true },
    {
      id: 'bold',
      icon: <Bold className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
      title: 'Bold (Ctrl+B)',
    },
    {
      id: 'italic',
      icon: <Italic className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
      title: 'Italic (Ctrl+I)',
    },
    {
      id: 'strike',
      icon: <Strikethrough className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive('strike'),
      title: 'Strikethrough',
    },
    { divider: true },
    {
      id: 'heading1',
      icon: <Heading1 className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive('heading', { level: 1 }),
      title: 'Heading 1',
    },
    {
      id: 'heading2',
      icon: <Heading2 className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive('heading', { level: 2 }),
      title: 'Heading 2',
    },
    {
      id: 'heading3',
      icon: <Heading3 className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive('heading', { level: 3 }),
      title: 'Heading 3',
    },
    { divider: true },
    {
      id: 'bulletList',
      icon: <List className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
      title: 'Bullet List',
    },
    {
      id: 'orderedList',
      icon: <ListOrdered className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
      title: 'Numbered List',
    },
    {
      id: 'blockquote',
      icon: <Quote className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive('blockquote'),
      title: 'Blockquote',
    },
  ]

  return (
    <div
      id="editor-toolbar"
      className="flex flex-wrap items-center gap-1 border-b border-border-default bg-bg-elevated px-4 py-2 select-none"
    >
      {tools.map((tool, index) => {
        if (tool.divider) {
          return (
            <div
              key={`divider-${index}`}
              className="mx-1 h-6 w-px bg-border-default"
            />
          )
        }

        return (
          <button
            key={tool.id}
            id={`toolbar-btn-${tool.id}`}
            type="button"
            onClick={tool.action}
            disabled={tool.disabled}
            className={`rounded-md p-2 transition-colors ${
              tool.disabled
                ? 'opacity-30 cursor-not-allowed'
                : tool.active
                ? 'bg-accent-primary text-text-primary'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
            title={tool.title}
          >
            {tool.icon}
          </button>
        )
      })}
    </div>
  )
}
export default EditorToolbar
