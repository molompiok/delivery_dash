import React from 'react';
import { X, Clock, Type, Save, Trash2, UserPlus, Calendar, Repeat, Star, Eye, Zap, ChevronDown } from 'lucide-react';
import { Schedule, User } from '../api/types';

interface ScheduleEditorSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    schedule: Partial<Schedule> | null;
    onSave: (data: any) => void;
    onDelete: (id: string) => void;
    availableUsers: any[];
}

const DAYS_OF_WEEK = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export function ScheduleEditorSidebar({
    isOpen,
    onClose,
    schedule,
    onSave,
    onDelete,
    availableUsers
}: ScheduleEditorSidebarProps) {
    const defaultForm = {
        title: '',
        label: '',
        description: '',
        scheduleType: 'WORK',
        scheduleCategory: 'WORK',
        recurrenceType: 'DATE_RANGE',
        startTime: '08:00',
        endTime: '17:00',
        daysOfWeek: [] as number[],
        specificDate: '',
        startDate: '',
        endDate: '',
        color: '#10b981',
        priority: 50,
        isActive: true,
        isPublic: false,
        affectsAvailability: true,
        assignedUserIds: [] as string[]
    };

    const [formData, setFormData] = React.useState<any>(defaultForm);

    React.useEffect(() => {
        if (schedule) {
            setFormData({
                ...defaultForm,
                ...schedule,
                assignedUserIds: schedule.assignedUsers?.map((u: any) => u.id) || []
            });
        } else {
            setFormData({ ...defaultForm });
        }
    }, [schedule]);

    if (!isOpen) return null;

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        onSave(formData);
    };

    const set = (key: string, value: any) => setFormData({ ...formData, [key]: value });

    return (
        <>
            {/* Mobile backdrop only */}
            <div
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] lg:hidden"
                onClick={onClose}
            />

            {/* Sidebar Container — inline on lg+, fixed overlay on smaller */}
            <aside className={`
        fixed top-0 right-0 h-full w-full max-w-md z-[101]
        lg:relative lg:top-auto lg:right-auto lg:max-w-none lg:z-auto
        lg:w-[380px] lg:min-w-[380px] lg:flex-shrink-0 lg:h-full
        bg-white dark:bg-slate-900 shadow-2xl lg:shadow-none
        border-l border-slate-100 dark:border-slate-800 lg:border-l-0 lg:border lg:rounded-[2.5rem]
        transform transition-transform duration-500 ease-out lg:transform-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        flex flex-col overflow-hidden
      `}>
                {/* Color Banner */}
                <div
                    className="h-3 w-full flex-shrink-0 transition-colors duration-300"
                    style={{ background: `linear-gradient(90deg, ${formData.color || '#10b981'}, ${formData.color || '#10b981'}88)` }}
                />

                {/* Header */}
                <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-md flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {schedule?.id ? 'Modifier' : 'Nouvel Horaire'}
                        </h2>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Édition en direct</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors text-slate-400 lg:hidden"
                    >
                        <X size={22} />
                    </button>
                </header>


                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">

                    {/* ── Informations ── */}
                    <Section icon={<Type size={16} />} label="Informations" color="text-rose-500">
                        <Field label="Titre">
                            <input type="text" required value={formData.title} onChange={e => set('title', e.target.value)}
                                className="input-field" placeholder="ex: Mission Centre-Nord" />
                        </Field>
                        <Field label="Libellé court">
                            <input type="text" value={formData.label || ''} onChange={e => set('label', e.target.value)}
                                className="input-field" placeholder="ex: MCN" />
                        </Field>
                        <Field label="Description">
                            <textarea value={formData.description || ''} onChange={e => set('description', e.target.value)}
                                className="input-field min-h-[60px] resize-none" placeholder="Notes optionnelles..." rows={2} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Catégorie">
                                <select value={formData.scheduleCategory} onChange={e => set('scheduleCategory', e.target.value)} className="input-field appearance-none">
                                    <option value="WORK">Travail</option>
                                    <option value="LEAVE">Congé</option>
                                    <option value="MANAGEMENT">Gestion</option>
                                </select>
                            </Field>
                            <Field label="Type">
                                <select value={formData.scheduleType} onChange={e => set('scheduleType', e.target.value)} className="input-field appearance-none">
                                    <option value="WORK">Travail</option>
                                    <option value="DELIVERY">Livraison</option>
                                    <option value="OPENING">Ouverture</option>
                                    <option value="AVAILABILITY">Dispo</option>
                                    <option value="CLOSED">Fermé</option>
                                </select>
                            </Field>
                        </div>
                    </Section>

                    {/* ── Récurrence ── */}
                    <Section icon={<Repeat size={16} />} label="Récurrence" color="text-indigo-500">
                        <Field label="Mode de récurrence">
                            <select value={formData.recurrenceType} onChange={e => set('recurrenceType', e.target.value)} className="input-field appearance-none">
                                <option value="WEEKLY">Hebdomadaire</option>
                                <option value="SPECIFIC_DATE">Date précise</option>
                                <option value="DATE_RANGE">Intervalle de dates</option>
                                <option value="MANUAL_OVERRIDE">Override manuel</option>
                            </select>
                        </Field>

                        {formData.recurrenceType === 'WEEKLY' && (
                            <Field label="Jours de la semaine">
                                <div className="flex gap-1.5 flex-wrap">
                                    {DAYS_OF_WEEK.map((d, i) => {
                                        const selected = (formData.daysOfWeek || []).includes(i);
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => {
                                                    const current = formData.daysOfWeek || [];
                                                    set('daysOfWeek', selected ? current.filter((v: number) => v !== i) : [...current, i]);
                                                }}
                                                className={`w-10 h-10 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border-2 ${selected
                                                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-300 hover:text-emerald-500'
                                                    }`}
                                            >
                                                {d.slice(0, 2)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>
                        )}

                        {(formData.recurrenceType === 'SPECIFIC_DATE' || formData.recurrenceType === 'MANUAL_OVERRIDE') && (
                            <Field label="Date">
                                <input type="date" value={formData.specificDate || ''} onChange={e => set('specificDate', e.target.value)} className="input-field" />
                            </Field>
                        )}

                        {formData.recurrenceType === 'DATE_RANGE' && (
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Début">
                                    <input type="date" value={formData.startDate || ''} onChange={e => set('startDate', e.target.value)} className="input-field" />
                                </Field>
                                <Field label="Fin">
                                    <input type="date" value={formData.endDate || ''} onChange={e => set('endDate', e.target.value)} className="input-field" />
                                </Field>
                            </div>
                        )}
                    </Section>

                    {/* ── Plages Horaires ── */}
                    <Section icon={<Clock size={16} />} label="Plages Horaires" color="text-amber-500">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Début">
                                <input type="time" required value={formData.startTime} onChange={e => set('startTime', e.target.value)} className="input-field" />
                            </Field>
                            <Field label="Fin">
                                <input type="time" required value={formData.endTime} onChange={e => set('endTime', e.target.value)} className="input-field" />
                            </Field>
                        </div>
                    </Section>

                    {/* ── Options & Visibilité ── */}
                    <Section icon={<Star size={16} />} label="Options & Visibilité" color="text-amber-500">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Couleur">
                                <div className="input-field flex items-center gap-2">
                                    <input type="color" value={formData.color} onChange={e => set('color', e.target.value)}
                                        className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent" />
                                    <span className="text-[10px] font-mono uppercase text-slate-500">{formData.color}</span>
                                </div>
                            </Field>
                            <Field label="Statut">
                                <div className="input-field flex items-center gap-2 cursor-pointer" onClick={() => set('isActive', !formData.isActive)}>
                                    <div className={`w-8 h-5 rounded-full transition-colors relative ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.isActive ? 'left-3.5' : 'left-0.5'}`} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{formData.isActive ? 'Actif' : 'Inactif'}</span>
                                </div>
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <ToggleField label="Public" value={formData.isPublic} onChange={v => set('isPublic', v)} />
                            <ToggleField label="Affecte Dispo" value={formData.affectsAvailability} onChange={v => set('affectsAvailability', v)} />
                        </div>
                    </Section>

                    {/* ── Chauffeurs ── */}
                    <Section icon={<UserPlus size={16} />} label="Assignation" color="text-cyan-500">
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                            {availableUsers.map(user => {
                                const isAssigned = formData.assignedUserIds?.includes(user.id);
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => {
                                            const ids = !isAssigned
                                                ? [...(formData.assignedUserIds || []), user.id]
                                                : (formData.assignedUserIds || []).filter((id: string) => id !== user.id);
                                            set('assignedUserIds', ids);
                                        }}
                                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group
                                            ${isAssigned
                                                ? 'bg-cyan-50 dark:bg-cyan-500/5 border-cyan-200 dark:border-cyan-500/30'
                                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-cyan-500/30'}
                                        `}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-black transition-colors ${isAssigned
                                                ? 'bg-cyan-500 border-cyan-400 text-white'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-cyan-500'
                                                }`}>
                                                {user.fullName?.charAt(0) || '?'}
                                            </div>
                                            <span className={`text-xs font-bold transition-colors ${isAssigned ? 'text-cyan-900 dark:text-cyan-100' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {user.fullName}
                                            </span>
                                        </div>
                                        {/* Switch UI */}
                                        <div className={`w-8 h-4.5 rounded-full transition-colors relative ${isAssigned ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                            <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${isAssigned ? 'left-[1.1rem]' : 'left-0.5'}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                </form>

                {/* Footer */}
                <footer className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex gap-3 flex-shrink-0">
                    {schedule?.id && (
                        <button type="button" onClick={() => onDelete(schedule.id!)}
                            className="p-3.5 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all" title="Supprimer">
                            <Trash2 size={18} />
                        </button>
                    )}
                    <button onClick={() => handleSubmit()}
                        className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10">
                        <Save size={16} />
                        Enregistrer
                    </button>
                </footer>
            </aside>
        </>
    );
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function Section({ icon, label, color, children }: { icon: React.ReactNode; label: string; color: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <div className={`flex items-center gap-2 ${color}`}>
                {icon}
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
            </div>
            {children}
        </section>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5">{label}</label>
            {children}
        </div>
    );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <Field label={label}>
            <div className="input-field flex items-center gap-2 cursor-pointer" onClick={() => onChange(!value)}>
                <div className={`w-8 h-5 rounded-full transition-colors relative ${value ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? 'left-3.5' : 'left-0.5'}`} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{value ? 'Oui' : 'Non'}</span>
            </div>
        </Field>
    );
}
