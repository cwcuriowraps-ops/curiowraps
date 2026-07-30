"use client";

import { Button } from "@dashboard/ui";
import { MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface ActionItem {
  label: string;
  icon?: any;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface ActionsMenuProps {
  items: ActionItem[];
  align?: "left" | "right";
}

export function ActionsMenu({ items, align = "right" }: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = items.length * 36 + 12; // approx height of menu
    const shouldOpenUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    const style: React.CSSProperties = {
      position: "fixed",
      width: "208px",
      zIndex: 9999,
    };

    if (shouldOpenUpward) {
      style.bottom = `${window.innerHeight - rect.top + 6}px`;
    } else {
      style.top = `${rect.bottom + 6}px`;
    }

    if (align === "left") {
      style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 216))}px`;
    } else {
      style.left = `${Math.max(8, Math.min(rect.right - 208, window.innerWidth - 216))}px`;
    }

    setMenuStyle(style);
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
      // Move focus to first non-disabled button inside the menu
      setTimeout(() => {
        if (menuRef.current) {
          const firstBtn = menuRef.current.querySelector(
            "button:not([disabled])"
          ) as HTMLButtonElement;
          firstBtn?.focus();
        }
      }, 0);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
        event.preventDefault();
        return;
      }

      if (event.key === "Tab") {
        setIsOpen(false);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!menuRef.current) return;
        const buttons = Array.from(
          menuRef.current.querySelectorAll("button:not([disabled])")
        ) as HTMLButtonElement[];

        if (buttons.length === 0) return;

        const activeElement = document.activeElement as HTMLButtonElement;
        const currentIndex = buttons.indexOf(activeElement);

        let nextIndex = 0;
        if (event.key === "ArrowDown") {
          nextIndex = currentIndex + 1 < buttons.length ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : buttons.length - 1;
        }

        buttons[nextIndex]?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, items.length]);

  return (
    <div className="relative inline-block text-left">
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleToggle}
        title="Actions menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="hover:bg-muted/80 focus:ring-2 focus:ring-accent/40"
      >
        <MoreVertical className="h-4 w-4 text-text-secondary hover:text-text-primary shrink-0 transition-colors" />
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            style={menuStyle}
            className="rounded-xl border border-border/80 bg-surface/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-100 ease-out"
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer text-left ${
                    item.danger
                      ? "text-error hover:bg-error/10 hover:text-error font-semibold"
                      : "text-text-primary hover:bg-muted/80 hover:text-text-primary"
                  } ${item.disabled ? "opacity-40 pointer-events-none" : ""}`}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" />}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
