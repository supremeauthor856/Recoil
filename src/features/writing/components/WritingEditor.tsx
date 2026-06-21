import React, { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { EditorToolbar } from './EditorToolbar'
import { Check, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react'
import * as writingService from '../../../services/writingService'

interface WritingEditorProps {
  initialContent: string | null
  onUpdate: (html: string) => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: number | null
  isZenMode: boolean
  onToggleZenMode: () => void
}

export const WritingEditor: React.FC<WritingEditorProps> = ({
  initialContent,
  onUpdate,
  saveStatus,
  lastSaved,
  isZenMode,
  onToggleZenMode,
}) => {
  const contentRef = useRef<string | null>(initialContent)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        }
      }),
      Placeholder.configure({
        placeholder: 'Begin your story or worldbuilding chronicle here...',
      }),
      CharacterCount,
    ],
    content: initialContent || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      contentRef.current = html
      onUpdate(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose focus:outline-none max-w-none text-text-primary h-full',
      },
    },
  })

  // Synchronize externally loaded content changes without triggering updates
  useEffect(() => {
    if (editor && initialContent !== contentRef.current) {
      contentRef.current = initialContent
      // Second argument set to false disables emitting standard update event!
      editor.commands.setContent(initialContent || '', false)
    }
  }, [editor, initialContent])

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const liveWordCount = editor ? writingService.countWords(editor.getHTML()) : 0

  return (
    <div
      id="writing-editor-container"
      className="flex flex-col flex-1 h-full bg-bg-base overflow-hidden"
    >
      {/* Editor Header Status & Zen Mode Toggle */}
      <div className="flex h-11 items-center justify-between border-b border-border-default bg-bg-elevated/60 px-4">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {saveStatus === 'saving' && (
            <span id="saving-indicator" className="flex items-center gap-1 text-accent-secondary">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Auto-saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span id="saved-indicator" className="flex items-center gap-1 text-success">
              <Check className="h-3.5 w-3.5" />
              Saved {lastSaved ? `at ${formatTime(lastSaved)}` : ''}
            </span>
          )}
          {saveStatus === 'error' && (
            <span id="save-error-indicator" className="flex items-center gap-1 text-error">
              <AlertCircle className="h-3.5 w-3.5" />
              Failed to save
            </span>
          )}
          {saveStatus === 'idle' && (
            <span id="idle-status" className="text-text-muted">
              Auto-save enabled
            </span>
          )}
        </div>

        <button
          id="toggle-zen-btn"
          onClick={onToggleZenMode}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
          title={isZenMode ? 'Exit distraction-free mode' : 'Enter distraction-free mode'}
        >
          {isZenMode ? (
            <>
              <EyeOff className="h-3.5 w-3.5 text-accent-highlight" />
              <span>Normal Mode</span>
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5 text-text-secondary" />
              <span>Zen Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Main Content & Sheets */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Formatting toolbar */}
        <EditorToolbar editor={editor} />

        {/* Scrollable sheet container */}
        <div
          id="editor-workspace"
          className="flex-1 overflow-y-auto scrollbar-custom p-4 sm:p-8 flex justify-center bg-bg-subtle"
        >
          <div
            id="editor-paper-sheet"
            className="prose-editor w-full max-w-[800px] min-h-[500px] h-fit rounded-xl border border-border-default bg-bg-base p-8 sm:p-12 shadow-md outline-none"
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Live Words & Character indicators at absolute bottom */}
      <div className="flex h-8 items-center justify-between border-t border-border-default bg-bg-elevated/40 px-4 text-[11px] font-mono text-text-secondary">
        <div>
          <span>Words count: <strong>{liveWordCount.toLocaleString()}</strong></span>
        </div>
        <div>
          <span>Characters: {editor?.storage.characterCount.characters().toLocaleString() ?? 0}</span>
        </div>
      </div>
    </div>
  )
}
export default WritingEditor
