import React, { useState } from "react";
import { 
  Plus, Image as ImageIcon, Video, Heart, Share2, Calendar, Sparkles, X, Layers, Loader2, Upload 
} from "lucide-react";
import { GalleryItem } from "../types";
import { uploadImage } from "../lib/supabase";

interface GalleryProps {
  galleryItems: GalleryItem[];
  onAddGalleryItem: (item: GalleryItem) => Promise<void>;
  isAdminOrTeacher: boolean;
}

export default function SchoolGalleryView({ 
  galleryItems, onAddGalleryItem, isAdminOrTeacher 
}: GalleryProps) {
  
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [url, setUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [type, setType] = useState<"image" | "video">("image");
  const [isLoading, setIsLoading] = useState(false);

  // Likes simulation map
  const [likes, setLikes] = useState<Record<string, number>>({});

  const handleLike = (id: string) => {
    setLikes(prev => ({
      ...prev,
      [id]: (prev[id] || 12) + 1
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setUploadingImage(true);
      setErrorText(null);
      // use the "school-gallery" bucket
      const uploadedUrl = await uploadImage(file, "school-gallery");
      setUrl(uploadedUrl);
    } catch (err: any) {
      console.error("Image upload failed", err);
      setErrorText("Failed to upload gallery image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    setIsLoading(true);
    const newItem: GalleryItem = {
      id: `gal-${Date.now()}`,
      title,
      url,
      type,
      caption: caption || "Captured during live campus sessions.",
      date: new Date().toISOString().split("T")[0]
    };

    await onAddGalleryItem(newItem);
    setIsLoading(false);
    setIsAdding(false);

    // Reset Form
    setTitle("");
    setCaption("");
    setUrl("");
    alert("New high-definition event shot uploaded directly onto the school media platform!");
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-75) shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">School Event Gallery</h2>
          <p className="text-xs text-slate-400 mt-1">Review live visuals, laboratory sessions, sports championships, and graduation moments</p>
        </div>

        {isAdminOrTeacher && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform"
          >
            <Plus className="h-4 w-4" />
            Upload Media Shot
          </button>
        )}
      </div>

      {/* Adding Media modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-205 dark:border-slate-800 overflow-hidden transform animate-in scale-in duration-200">
            
            <div className="p-5 border-b border-slate-150 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Post New Media Item</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Image Shot Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Sports Relay Medal Ceremony"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-707"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Upload Media Shot *</label>
                
                <div className="relative">
                  {url && (
                     <img src={url} alt="Preview" className="h-40 w-full object-cover rounded-xl mb-3 border border-slate-200 dark:border-slate-700" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage || isLoading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    disabled={uploadingImage || isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading to Supabase...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {url ? "Change Image" : "Choose Image from Device Gallery"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Short Caption</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Taken on the outdoor synthetic running track."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-350"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl bg-slate-105 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || uploadingImage}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isLoading ? "Uploading..." : "Publish to Album"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Grid view of cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {galleryItems.map((item) => {
          const ratingCount = likes[item.id] || 15;

          return (
            <div 
              key={item.id} 
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-755 rounded-2xl overflow-hidden shadow-3xs flex flex-col justify-between group hover:border-emerald-500/10 hover:shadow-xs transition-all duration-300"
            >
              
              {/* Media image container */}
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                />
                
                {/* Overlay type indicator */}
                <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/40 backdrop-blur-xs text-white">
                  {item.type === "image" ? <ImageIcon className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                </div>
              </div>

              {/* Text Body */}
              <div className="p-4 space-y-1.5">
                <h3 className="font-extrabold text-xs text-slate-800 dark:text-white leading-snug tracking-tight">
                  {item.title}
                </h3>
                {item.caption && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-4 pb-4 pt-3 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center text-[10px] text-slate-405 font-medium">
                <span className="flex items-center gap-1 font-mono uppercase font-bold text-slate-400">
                  <Calendar className="h-3.5 w-3.5" /> {item.date}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(item.id)}
                    className="flex items-center gap-1 text-rose-500 font-bold font-sans hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Heart className="h-3.5 w-3.5 fill-rose-500/20 group-hover:fill-rose-500" />
                    {ratingCount}
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
