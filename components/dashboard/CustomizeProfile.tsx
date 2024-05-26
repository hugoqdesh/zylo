"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { ClipLoader } from "react-spinners";

const CustomizeProfile = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [background, setBackground] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [borderColor, setBorderColor] = useState<string>("");
  const [links, setLinks] = useState<{ [key: string]: string }>({});

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (userId) {
        try {
          const response = await fetch(`/api/getUserProfile?userId=${userId}`);
          const data = await response.json();
          if (response.ok) {
            setBackground(data.user.backgroundImage);
            setAvatar(data.user.image);
            setName(data.user.name);
            setBio(data.user.bio || "");
            setUsername(data.user.username);
            setBorderColor(data.user.borderColor);
            setLinks(data.user.links || {});
          } else {
            setError(data.message);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setError("An unexpected error occurred");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [userId]);

  const backgroundPreview = useMemo(
    () =>
      background && (
        <Image
          src={background}
          alt="Background Preview"
          width={128}
          height={128}
          className="mt-2 w-32 h-auto"
        />
      ),
    [background]
  );

  const avatarPreview = useMemo(
    () =>
      avatar && (
        <Image
          src={avatar}
          alt="Avatar Preview"
          width={128}
          height={128}
          className="mt-2 w-32 h-auto rounded"
        />
      ),
    [avatar]
  );

  const profileSchema = z.object({
    name: z
      .string()
      .min(3, "Name must be between 3 and 15 characters long")
      .max(15, "Name must be between 3 and 15 characters long")
      .nonempty("Name cannot be empty"),
    bio: z.string().max(200, "Bio must be 200 characters or fewer").optional(),
    background: z
      .string()
      .url("Invalid background URL")
      .nonempty("Background URL cannot be empty"),
    avatar: z
      .string()
      .url("Invalid avatar URL")
      .nonempty("Avatar URL cannot be empty"),
    borderColor: z.string().optional(),
    links: z.record(z.string().url("Invalid URL")).optional(),
  });

  const handleSaveChanges = async () => {
    setMessage(null);
    setError(null);
    setSaving(true);

    if (!userId) {
      setError("User not authenticated");
      setSaving(false);
      return;
    }

    try {
      for (const key of Object.keys(links)) {
        if (links[key] === "") {
          delete links[key];
        }
      }

      profileSchema.parse({
        name,
        bio,
        background,
        avatar,
        borderColor,
        links,
      });

      const response = await fetch("/api/updateUser", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          newName: name,
          newImage: avatar,
          newBio: bio === "" ? null : bio,
          newBackgroundImage: background,
          newBorderColor: borderColor,
          newLinks: links,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(`Error: ${data.message}`);
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        setError(validationError.errors[0].message);
      } else {
        console.error("Error:", validationError);
        setError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLinkChange = (key: string, value: string) => {
    setLinks((prevLinks) => ({
      ...prevLinks,
      [key]: value,
    }));
  };

  return (
    <div className="min-h-screen py-10 max-w-md mx-auto">
      {loading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 opacity-100 transition-opacity duration-500 ease-in-out animate-fadeIn">
          <div className="text-center">
            <ClipLoader size={50} color={"#fff"} loading={loading} />
            <p className="text-white mt-4">Loading your profile...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center">
            Customize Your Profile
          </h1>

          {username ? (
            <a
              href={`/${username}`}
              className="text-blue-500 text-center mb-5 flex w-[200px] mx-auto justify-center hover:underline"
            >
              View your profile
            </a>
          ) : (
            <a
              href="/dashboard/settings"
              className="text-red-500 text-center mb-5 flex w-[200px] mx-auto justify-center hover:underline"
            >
              Set a username to view your profile
            </a>
          )}

          <Section title="Profile Details">
            <TextInput
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              placeholder="Enter your name"
            />
            <TextareaInput
              value={bio}
              onChange={(e: any) => setBio(e.target.value)}
              placeholder="Enter your bio"
            />
          </Section>

          <Section title="Profile Images">
            <TextInput
              value={avatar}
              onChange={(e: any) => setAvatar(e.target.value)}
              placeholder="Enter your avatar URL"
            />
            {avatarPreview}
            <TextInput
              value={background}
              onChange={(e: any) => setBackground(e.target.value)}
              placeholder="Enter your background URL"
            />
            {backgroundPreview}
          </Section>

          <Section title="Profile Border Color">
            <TextInput
              value={borderColor}
              onChange={(e: any) => setBorderColor(e.target.value)}
              placeholder="Enter your border color (hex code)"
            />
          </Section>

          <Section title="Profile Links">
            <TextInput
              value={links.website || ""}
              onChange={(e: any) => handleLinkChange("website", e.target.value)}
              placeholder="Enter your website URL"
            />
            <TextInput
              value={links.github || ""}
              onChange={(e: any) => handleLinkChange("github", e.target.value)}
              placeholder="Enter your GitHub URL"
            />
            <TextInput
              value={links.twitter || ""}
              onChange={(e: any) => handleLinkChange("twitter", e.target.value)}
              placeholder="Enter your Twitter URL"
            />
            <TextInput
              value={links.instagram || ""}
              onChange={(e: any) =>
                handleLinkChange("instagram", e.target.value)
              }
              placeholder="Enter your Instagram URL"
            />
            <TextInput
              value={links.youtube || ""}
              onChange={(e: any) => handleLinkChange("youtube", e.target.value)}
              placeholder="Enter your YouTube URL"
            />
            <TextInput
              value={links.tiktok || ""}
              onChange={(e: any) => handleLinkChange("tiktok", e.target.value)}
              placeholder="Enter your TikTok URL"
            />
            <TextInput
              value={links.spotify || ""}
              onChange={(e: any) => handleLinkChange("spotify", e.target.value)}
              placeholder="Enter your Spotify URL"
            />
          </Section>

          {error && (
            <div className="bg-red-500 text-white p-2 mb-4 rounded text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-500 text-white p-2 mb-4 rounded text-center">
              {message}
            </div>
          )}
          <button
            onClick={handleSaveChanges}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none flex m-auto transition duration-200"
          >
            {saving ? "Saving..." : "Save Changes"}{" "}
          </button>
        </div>
      )}
    </div>
  );
};

const Section = ({ title, children }: any) => (
  <section className="mb-8">
    <h2 className="text-2xl font-semibold text-start mb-1">{title}</h2>
    <div className="mb-4 text-center">{children}</div>
  </section>
);

const TextInput = ({ value, onChange, placeholder }: any) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="text-white rounded w-full text-start px-2.5 py-1.5 border border-white/5 bg-white/5 hover:border-white/10 placeholder:text-white/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 mb-2"
  />
);

const TextareaInput = ({ value, onChange, placeholder }: any) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={5}
    className="text-white rounded w-full text-start px-2.5 py-1.5 border border-white/5 bg-white/5 hover:border-white/10 placeholder:text-white/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200 mb-2 resize-none"
  />
);

export default CustomizeProfile;
