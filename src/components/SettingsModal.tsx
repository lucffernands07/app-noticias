import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  Clock,
  Send,
  Settings2,
  ShieldCheck,
  Tag,
  X,
  Zap,
} from "lucide-react";
import type { Category } from "@/types";
import {
  ALERT_CATEGORIES,
  type Frequency,
  type NotificationSettings,
} from "@/lib/settings";

type Permission = NotificationPermission | "unsupported";

type Props = {
  open: boolean;
  settings: NotificationSettings;
  onClose: () => void;
  onTogglePush: (enabled: boolean) => void;
  onRequestPermission: () => void;
  onToggleCategory: (cat: Category) => void;
  onChangeTime: (time: string) => void;
  onChangeFrequency: (freq: Frequency) => void;
  onTestNotification: () => void;
  permission: Permission;
  requesting: boolean;
};

export function SettingsModal({
  open,
  settings,
  onClose,
  onTogglePush,
  onRequestPermission,
  onToggleCategory,
  onChangeTime,
  onChangeFrequency,
  onTestNotification,
  permission,
  requesting,
}: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | "ok" | "fail">(null);
  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pushSupported = permission !== "unsupported";
  const permGranted = permission === "granted";
  const permDenied = permission === "denied";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Configurações de notificações"
        className="relative z-10 max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0c0c0e] p-5 shadow-2xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/20">
              <Settings2 className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">
                Notificações
              </h2>
              <p className="text-[11px] text-gray-500">
                Ajuste seus alertas de notícias
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* 1. Push intent + permission request */}
        <Section
          icon={<BellRing className="h-4 w-4" />}
          title="Notificações no navegador"
          desc="Ative os alertas e permita as notificações do sistema."
        >
          {!pushSupported ? (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[12px] text-amber-300 ring-1 ring-amber-500/20">
              Seu navegador não suporta notificações push.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <span className="text-[12.5px] font-medium text-gray-200">
                  Quero receber alertas
                </span>
                <Switch
                  checked={settings.pushEnabled}
                  onChange={onTogglePush}
                  label={settings.pushEnabled ? "Sim" : "Não"}
                />
              </div>

              {/* Permission status + explicit request button */}
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <PermissionDot state={permission} />
                  <span className="text-[12px] text-gray-300">
                    {permGranted
                      ? "Permissão concedida"
                      : permDenied
                      ? "Permissão negada"
                      : "Permissão pendente"}
                  </span>
                </div>
                {permGranted ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                    Ativo
                  </span>
                ) : permDenied ? (
                  <span className="text-[11px] text-gray-500">
                    Ajuste nas configurações do navegador
                  </span>
                ) : (
                  <button
                    onClick={onRequestPermission}
                    disabled={requesting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-[12px] font-semibold text-cyan-300 ring-1 ring-cyan-400/25 transition-all hover:bg-cyan-400/25 disabled:opacity-60"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {requesting ? "Solicitando…" : "Permitir notificações"}
                  </button>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* 2. Category selection — always enabled */}
        <Section
          icon={<Tag className="h-4 w-4" />}
          title="Categorias para alertar"
          desc="Escolha os temas que deseja receber no resumo."
        >
          <div className="space-y-2">
            {ALERT_CATEGORIES.map((cat) => {
              const checked = settings.alertCategories.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  className={[
                    "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition-colors",
                    checked
                      ? "border-cyan-400/30 bg-cyan-400/[0.06]"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]",
                  ].join(" ")}
                >
                  <span className="text-[13px] font-medium text-gray-200">
                    {cat.label}
                  </span>
                  <Switch
                    checked={checked}
                    onChange={() => onToggleCategory(cat.id)}
                    compact
                    ariaLabel={`Alertas de ${cat.label}`}
                  />
                </label>
              );
            })}
          </div>
        </Section>

        {/* 3. Schedule — free time input, always enabled */}
        <Section
          icon={<Clock className="h-4 w-4" />}
          title="Horário do resumo"
          desc="Escolha qualquer horário para receber o resumo diário."
        >
          <label className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
            <span className="text-[13px] font-medium text-gray-200">
              Hora do alerta
            </span>
            <input
              type="time"
              value={settings.alertTime}
              onChange={(e) => onChangeTime(e.target.value)}
              className="rounded-md border border-white/10 bg-[#0a0a0b] px-3 py-1.5 text-[14px] font-semibold text-cyan-300 outline-none transition-colors [color-scheme:dark] focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/30"
              aria-label="Horário do resumo"
            />
          </label>
          <p className="mt-2 text-[11px] text-gray-500">
            Formato 24h. Ex: 07:45, 13:15, 21:30.
          </p>
        </Section>

        {/* 4. Frequency — always enabled */}
        <Section
          icon={<Zap className="h-4 w-4" />}
          title="Frequência"
          desc="Defina o tipo de alerta que deseja receber."
        >
          <div className="grid grid-cols-2 gap-2">
            <FreqButton
              active={settings.frequency === "diario"}
              onClick={() => onChangeFrequency("diario")}
              label="Diário"
              desc="Resumo completo das categorias"
            />
            <FreqButton
              active={settings.frequency === "urgentes"}
              onClick={() => onChangeFrequency("urgentes")}
              label="Urgentes"
              desc="Apenas notícias das últimas 6h"
            />
          </div>
        </Section>

        {/* Status hint */}
        {settings.alertCategories.length > 0 && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-cyan-400/[0.05] p-3.5 ring-1 ring-cyan-400/15">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            <p className="text-[12px] leading-relaxed text-cyan-100/80">
              {settings.pushEnabled
                ? "Você receberá um resumo às "
                : "Quando ativar os alertas e permitir notificações, receberá um resumo às "}
              <strong>{settings.alertTime}</strong> com as principais notícias de{" "}
              <strong>{settings.alertCategories.length} categorias</strong>.
            </p>
          </div>
        )}

        {/* Test notification button — shown once permission is granted. */}
        {permGranted && (
          <div className="mt-3">
            <button
              onClick={async () => {
                setTesting(true);
                setTestResult(null);
                await onTestNotification();
                setTesting(false);
                setTestResult("ok");
                setTimeout(() => setTestResult(null), 4000);
              }}
              disabled={testing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] py-2.5 text-[13px] font-semibold text-cyan-300 transition-all hover:bg-cyan-400/[0.12] disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {testing ? "Enviando teste…" : "Testar Notificação Agora"}
            </button>
            {testResult === "ok" && (
              <p className="mt-2 text-center text-[11.5px] text-emerald-400">
                Notificação de teste enviada. Verifique seu sistema.
              </p>
            )}
            {testResult === "fail" && (
              <p className="mt-2 text-center text-[11.5px] text-red-400">
                Não foi possível enviar. Verifique as permissões do navegador.
              </p>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-white/[0.06] py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/[0.1]"
        >
          Concluído
        </button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 border-b border-white/5 pb-5 last:border-0 last:pb-0">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] text-gray-300 ring-1 ring-white/5">
          {icon}
        </span>
        <div>
          <h3 className="text-[13px] font-semibold text-white">{title}</h3>
          <p className="text-[11px] text-gray-500">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function PermissionDot({ state }: { state: Permission }) {
  const color =
    state === "granted"
      ? "bg-emerald-400"
      : state === "denied"
      ? "bg-red-400"
      : "bg-gray-500";
  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}

function Switch({
  checked,
  onChange,
  label,
  compact,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  compact?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={[
        "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200",
        checked ? "bg-cyan-400" : "bg-white/[0.08]",
        compact ? "h-5 w-9" : "h-6 w-11",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block rounded-full bg-white shadow transition-transform duration-200",
          compact ? "h-3.5 w-3.5" : "h-4.5 w-4.5",
          compact
            ? checked
              ? "translate-x-[18px]"
              : "translate-x-[3px]"
            : checked
            ? "translate-x-[22px]"
            : "translate-x-[3px]",
        ].join(" ")}
      />
      {label && (
        <span className="ml-2.5 text-[12.5px] font-medium text-gray-200">
          {label}
        </span>
      )}
    </button>
  );
}

function FreqButton({
  active,
  onClick,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl border p-3 text-left transition-all",
        active
          ? "border-cyan-400/40 bg-cyan-400/[0.07]"
          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <div className="mb-0.5 text-[13px] font-semibold text-white">{label}</div>
      <div className="text-[10.5px] leading-snug text-gray-500">{desc}</div>
    </button>
  );
}
