import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { usePermissionsContext } from '../contexts/PermissionsContext';
import { FeatureWithChildren } from '../types';

export function Sidebar() {
  const { menuItems } = usePermissionsContext();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderMenuItem = (item: FeatureWithChildren, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = location.pathname === item.route;
    const isExpanded = expandedItems.has(item.id);
    const paddingLeft = level > 0 ? `${(level * 1.5) + 1}rem` : '1rem';

    return (
      <div key={item.id}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(item.id)}
            className="w-full flex items-center justify-between py-3 text-sm hover:bg-slate-100 transition-colors"
            style={{ paddingLeft, paddingRight: '1rem' }}
          >
            <span className="font-medium text-slate-700">{item.menu_label}</span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
          </button>
        ) : (
          <Link
            to={item.route}
            className={`block py-3 text-sm hover:bg-slate-100 transition-colors ${
              isActive ? 'bg-slate-200 text-slate-900 font-medium' : 'text-slate-700'
            }`}
            style={{ paddingLeft, paddingRight: '1rem' }}
          >
            {item.menu_label}
          </Link>
        )}

        {hasChildren && isExpanded && (
          <div className="bg-slate-50">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen overflow-y-auto">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Sistema de Gestão</h1>
      </div>

      <nav className="py-4">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>
    </aside>
  );
}
