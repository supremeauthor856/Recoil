import { Outlet } from 'react-router-dom'
import { ContentHeader } from './ContentHeader'
import { ScrollArea } from '../ui/ScrollArea'

export const MainContent = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <ContentHeader />
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea>
          <Outlet />
        </ScrollArea>
      </div>
    </div>
  )
}
