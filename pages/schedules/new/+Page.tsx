import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { scheduleService } from '../../../api/schedules';
import { User, ScheduleCategory, ScheduleLink } from '../../../api/types';
import { driverService } from '../../../api/drivers';

export default function Page() {
    const [user, setUser] = useState<User | null>(null);
    const [drivers, setDrivers] = useState<User[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduleCategory: 'WORK' as ScheduleCategory,
        recurrenceType: 'WEEKLY' as 'WEEKLY' | 'DATE_RANGE' | 'SPECIFIC_DATE',
        dayOfWeek: 1,
        startDate: '',
        endDate: '',
        startTime: '08:00',
        endTime: '18:00',
        color: '#3B82F6',
        icon: 'Briefcase',
        affectsAvailability: true,
    });
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [links, setLinks] = useState<ScheduleLink[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('delivery_user');
        if (userStr) {
            const u = JSON.parse(userStr);
            setUser(u);
            loadDrivers(u.companyId);
        }
    }, []);

    const loadDrivers = async (companyId: string) => {
        try {
            const res = await driverService.listDrivers();
            // Extract drivers from CompanyDriverSetting array
            const driversList = res.data.map((cds: any) => cds.driver);
            setDrivers(driversList);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.companyId) return;

        setIsSubmitting(true);
        try {
            const scheduleData = {
                ...formData,
                ownerType: 'Company',
                ownerId: user.companyId,
                links: links.length > 0 ? links : undefined,
                isPublic: false,
                isActive: true,
            };

            const res = await scheduleService.createSchedule(scheduleData);

            // Assign users if any selected
            if (selectedUserIds.length > 0 && res.data.id) {
                await scheduleService.assignUsers(res.data.id, selectedUserIds);
            }

            // Redirect back to schedules page
            window.location.href = '/schedules';
        } catch (e) {
            console.error(e);
            alert('Erreur lors de la création de l\'horaire');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addLink = () => {
        setLinks([...links, { name: '', url: '', icon: 'Link' }]);
    };

    const removeLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const updateLink = (index: number, field: keyof ScheduleLink, value: string) => {
        const newLinks = [...links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setLinks(newLinks);
    };

    const toggleUser = (userId: string) => {
        if (selectedUserIds.includes(userId)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
        } else {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    const categoryColors = {
        WORK: '#3B82F6',
        LEAVE: '#F59E0B',
        MANAGEMENT: '#8B5CF6',
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Créer un horaire</h1>
                <a href="/schedules" className="text-gray-600 hover:text-gray-800">
                    <X size={24} />
                </a>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full p-2 border rounded-lg"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                        <select
                            className="w-full p-2 border rounded-lg"
                            value={formData.scheduleCategory}
                            onChange={e => {
                                const category = e.target.value as ScheduleCategory;
                                setFormData({
                                    ...formData,
                                    scheduleCategory: category,
                                    color: categoryColors[category],
                                    affectsAvailability: category !== 'MANAGEMENT'
                                });
                            }}
                        >
                            <option value="WORK">Travail</option>
                            <option value="LEAVE">Congé</option>
                            <option value="MANAGEMENT">Gestion</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Récurrence</label>
                        <select
                            className="w-full p-2 border rounded-lg"
                            value={formData.recurrenceType}
                            onChange={e => setFormData({ ...formData, recurrenceType: e.target.value as any })}
                        >
                            <option value="WEEKLY">Hebdomadaire</option>
                            <option value="DATE_RANGE">Plage de dates</option>
                            <option value="SPECIFIC_DATE">Date spécifique</option>
                        </select>
                    </div>

                    {formData.recurrenceType === 'WEEKLY' && (
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jour de la semaine</label>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={formData.dayOfWeek}
                                onChange={e => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                            >
                                <option value={1}>Lundi</option>
                                <option value={2}>Mardi</option>
                                <option value={3}>Mercredi</option>
                                <option value={4}>Jeudi</option>
                                <option value={5}>Vendredi</option>
                                <option value={6}>Samedi</option>
                                <option value={0}>Dimanche</option>
                            </select>
                        </div>
                    )}

                    {formData.recurrenceType === 'DATE_RANGE' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                        <input
                            type="time"
                            className="w-full p-2 border rounded-lg"
                            value={formData.startTime}
                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
                        <input
                            type="time"
                            className="w-full p-2 border rounded-lg"
                            value={formData.endTime}
                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                        <input
                            type="color"
                            className="w-full h-10 border rounded-lg"
                            value={formData.color}
                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icône</label>
                        <select
                            className="w-full p-2 border rounded-lg"
                            value={formData.icon}
                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                        >
                            <option value="Briefcase">Briefcase</option>
                            <option value="Calendar">Calendar</option>
                            <option value="Plane">Plane</option>
                            <option value="Coffee">Coffee</option>
                            <option value="Users">Users</option>
                            <option value="Clock">Clock</option>
                        </select>
                    </div>
                </div>

                {/* Assign Users */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assigner à ({selectedUserIds.length} sélectionné{selectedUserIds.length > 1 ? 's' : ''})
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                        {drivers.map(driver => (
                            <label key={driver.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedUserIds.includes(driver.id)}
                                    onChange={() => toggleUser(driver.id)}
                                    className="rounded"
                                />
                                <span className="text-sm">{driver.fullName}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Links */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Liens</label>
                        <button
                            type="button"
                            onClick={addLink}
                            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                            <Plus size={16} /> Ajouter un lien
                        </button>
                    </div>
                    {links.map((link, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="Nom"
                                className="flex-1 p-2 border rounded-lg"
                                value={link.name}
                                onChange={e => updateLink(i, 'name', e.target.value)}
                            />
                            <input
                                type="url"
                                placeholder="URL"
                                className="flex-1 p-2 border rounded-lg"
                                value={link.url}
                                onChange={e => updateLink(i, 'url', e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => removeLink(i)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <a href="/schedules" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        Annuler
                    </a>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center disabled:opacity-50"
                    >
                        <Save size={18} className="mr-2" />
                        {isSubmitting ? 'Création...' : 'Créer l\'horaire'}
                    </button>
                </div>
            </form>
        </div>
    );
}
