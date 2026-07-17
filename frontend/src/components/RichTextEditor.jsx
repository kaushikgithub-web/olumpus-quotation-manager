import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  List,
  ListOrdered,
  Table as TableIcon,
} from 'lucide-react'

/**
 * Rich text editor for quotation line-item descriptions. Outputs clean
 * HTML (via editor.getHTML()) that's stored directly in
 * quotation_items.description and later rendered as-is inside the
 * Puppeteer-generated PDF (Phase 8) — no format conversion needed.
 */
export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'max-w-none focus:outline-none min-h-[80px] px-3 py-2 text-sm [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-300 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-slate-50 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  const btn = (active) =>
    [
      'p-1.5 rounded hover:bg-slate-100 transition-colors',
      active ? 'text-brand-dark bg-slate-100' : 'text-slate-500',
    ].join(' ')

  return (
    <div className="border border-slate-300 rounded overflow-hidden focus-within:ring-2 focus-within:ring-brand-light">
      <div className="flex items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive('bold'))}
          title="Bold"
        >
          <BoldIcon size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive('italic'))}
          title="Italic"
        >
          <ItalicIcon size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive('bulletList'))}
          title="Bullet list"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive('orderedList'))}
          title="Numbered list"
        >
          <ListOrdered size={14} />
        </button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
              .run()
          }
          className={btn(false)}
          title="Insert table"
        >
          <TableIcon size={14} />
        </button>
      </div>

      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  )
}
