import React, { useState } from "react";
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Header from "../components/Header";

export default function ProfileScreen() {
  const [profileImage, setProfileImage] = useState(null);
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [aboutMe, setAboutMe] = useState("");
  const [links, setLinks] = useState({
    linkedin: "",
    github: "",
    portfolio: "",
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const pickResume = async () => {
    const result = await DocumentPicker.getDocumentAsync();
    if (result.assets) setResume(result.assets[0]);
  };

  const pickCoverLetter = async () => {
    const result = await DocumentPicker.getDocumentAsync();
    if (result.assets) setCoverLetter(result.assets[0]);
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
        <Header />
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20 }}>
        Profile
      </Text>

      {/* Profile Image */}
      <View style={{ alignItems: "center", marginBottom: 30 }}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={{ width: 120, height: 120, borderRadius: 60 }}
          />
        ) : (
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#e5e5e5",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text>No Image</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={pickImage}
          style={{
            marginTop: 10,
            backgroundColor: "#4f46e5",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white" }}>Upload Profile Picture</Text>
        </TouchableOpacity>
      </View>

      {/* About Me */}
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
        About Me
      </Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#d4d4d4",
          padding: 12,
          borderRadius: 8,
          height: 120,
          textAlignVertical: "top",
          marginBottom: 20,
        }}
        multiline
        value={aboutMe}
        onChangeText={setAboutMe}
        placeholder="Write something about yourself..."
      />

      {/* Resume Upload */}
      <UploadItem
        title="Resume"
        file={resume}
        onPress={pickResume}
      />

      {/* Cover Letter Upload */}
      <UploadItem
        title="Cover Letter"
        file={coverLetter}
        onPress={pickCoverLetter}
      />

      {/* Personal Links */}
      <Text style={{ fontSize: 18, fontWeight: "600", marginTop: 30 }}>
        Personal Links
      </Text>

      <InputField
        label="LinkedIn"
        value={links.linkedin}
        onChange={(t) => setLinks({ ...links, linkedin: t })}
      />

      <InputField
        label="GitHub"
        value={links.github}
        onChange={(t) => setLinks({ ...links, github: t })}
      />

      <InputField
        label="Portfolio / Website"
        value={links.portfolio}
        onChange={(t) => setLinks({ ...links, portfolio: t })}
      />

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function UploadItem({ title, file, onPress }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
        {title}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: "#4f46e5",
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white" }}>
          {file ? `Uploaded: ${file.name}` : `Upload ${title}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function InputField({ label, value, onChange }) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 16, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={`Enter your ${label.toLowerCase()}`}
        style={{
          borderWidth: 1,
          borderColor: "#d4d4d4",
          padding: 12,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
