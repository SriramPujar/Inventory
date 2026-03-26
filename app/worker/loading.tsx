import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-1/6 mb-4"></div>
                <div className="h-12 bg-gray-200 rounded w-48"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2 w-1/2">
                                <div className="h-5 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            </div>
                            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="h-8 bg-gray-200 rounded w-full"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center items-center py-12 text-gray-400">
                <Loader2 className="animate-spin mr-2" size={24} />
                <span>Loading your orders...</span>
            </div>
        </div>
    );
}
