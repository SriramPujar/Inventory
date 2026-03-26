import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-1/6 mb-4"></div>
                <div className="flex gap-4">
                    <div className="h-12 bg-gray-200 rounded w-48"></div>
                    <div className="h-12 bg-gray-200 rounded w-48"></div>
                </div>
            </div>

            <div className="flex justify-center items-center py-12 text-gray-400">
                <Loader2 className="animate-spin mr-2" size={24} />
                <span>Loading dashboard data...</span>
            </div>
        </div>
    );
}
