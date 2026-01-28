import React, { useEffect, useState } from 'react';
import { FileText, Upload, Trash2, Eye, Download, Calendar, Loader2 } from 'lucide-react';
import { documentService } from '../../../api/documents';
import { FileRecord } from '../../../api/types';

export default function Page() {
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState('OTHER');
    const [expiryDate, setExpiryDate] = useState('');

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        try {
            const res = await documentService.listCompanyFiles();
            setFiles(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setIsUploading(true);
        try {
            await documentService.uploadDocument(selectedFile, category);
            setSelectedFile(null);
            await loadFiles();
        } catch (e) {
            console.error("Upload failed", e);
            alert("Erreur lors de l'upload");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Supprimer ce fichier ?')) {
            try {
                await documentService.deleteFile(id);
                loadFiles();
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Documents Entreprise</h1>
                    <p className="text-gray-500">Stockez et gérez vos documents légaux (K-bis, Assurances...).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                        <Upload size={20} className="mr-2 text-emerald-600" />
                        Nouveau Document
                    </h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fichier</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                                <input
                                    type="file"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer block">
                                    {selectedFile ? (
                                        <div className="text-emerald-600 font-medium truncate">{selectedFile.name}</div>
                                    ) : (
                                        <div className="text-gray-500 text-sm">
                                            Cliquez pour sélectionner<br />ou glissez un fichier ici
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                            <select
                                className="w-full p-2 border rounded-lg bg-gray-50"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                <option value="REGISTRATION">Registre Commerce</option>
                                <option value="INSURANCE">Assurance</option>
                                <option value="TAX">Fiscalité</option>
                                <option value="OTHER">Autre</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration (Optionnel)</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    className="w-full pl-10 p-2 border rounded-lg"
                                    value={expiryDate}
                                    onChange={e => setExpiryDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!selectedFile || isUploading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center"
                        >
                            {isUploading ? <Loader2 className="animate-spin" size={20} /> : 'Uploader'}
                        </button>
                    </form>
                </div>

                {/* File List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="font-bold text-gray-800">Fichiers ({files.length})</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[600px] p-2">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-400">Chargement...</div>
                        ) : files.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                                <FileText size={48} className="mb-4 opacity-20" />
                                <p>Aucun document.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {files.map(file => (
                                    <div key={file.id} className="flex p-3 hover:bg-gray-50 rounded-lg group border border-transparent hover:border-gray-100 transition-all items-center">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">{file.name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <span className="bg-gray-100 px-1.5 rounded">{file.tableColumn}</span>
                                                {file.metadata?.expiryDate && (
                                                    <span className={`flex items-center ${new Date(file.metadata.expiryDate) < new Date() ? 'text-red-500 font-bold' : 'text-gray-400'
                                                        }`}>
                                                        <Calendar size={10} className="mr-1" />
                                                        Exp: {new Date(file.metadata.expiryDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                            <button
                                                onClick={() => window.open(`/api/v1/fs/${file.name}`, '_blank')}
                                                className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg" title="Voir"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
