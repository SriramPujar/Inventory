import Link from "next/link";
import { Shield, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Inventory Management System</h1>
        <p className="text-xl text-gray-600">Select your portal to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Link href="/login/admin" className="group">
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-blue-600 transition-colors">
              <Shield className="text-blue-600 group-hover:text-white transition-colors" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Admin Portal</h2>
            <p className="text-center text-gray-500">
              Manage business, workers, orders, and view analytics.
            </p>
          </div>
        </Link>

        <Link href="/login/worker" className="group">
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-green-600 transition-colors">
              <Users className="text-green-600 group-hover:text-white transition-colors" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Worker Portal</h2>
            <p className="text-center text-gray-500">
              View assigned orders, update status, and record sales.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
