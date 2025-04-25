
import React, { useState,useContext,useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import LinearGradient from 'react-native-linear-gradient';

import {AuthContext} from './AuthContext';
import axios from 'axios';


const Profile = () => {


  const [taskCount, setTaskCount] = useState(0); // Task count (set to 0 instead of "")
  const [referralCount, setReferralCount] = useState(0);
  const {userData, setUserData} = useContext(AuthContext);
  const [profileImage, setProfileImage] = useState(null);
  const date = new Date().toISOString().split('T')[0];
  const [error, setError] = useState(null);
  const [membershipModalVisible, setMembershipModalVisible] = useState(false);
  const openMembershipModal = () => setMembershipModalVisible(true);
  const closeMembershipModal = () => setMembershipModalVisible(false);

  // profile image function

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!userData?.id) return;

      try {
        const response = await axios.get(
          `https://signpostphonebook.in/image_upload_for_new_database.php?id=${userData.id}`,
        );
        // console.log("Fetched Image Response:", response.data);

        if (response.data.success) {
          const imageUrl = response.data.imageUrl;
          const fullUrl = imageUrl.startsWith('http')
            ? imageUrl
            : `https://signpostphonebook.in/${imageUrl}`;
          setProfileImage(fullUrl + `?t=${new Date().getTime()}`); // Prevent caching
          setUserData(prevData => ({...prevData, profileImage: fullUrl}));
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      }
    };

    fetchProfileImage();
  }, [userData.id, setUserData]);

  const handleImagePick = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to the gallery.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const selectedImage = result.assets[0].uri;
      console.log('Selected Image URI:', selectedImage);
      setProfileImage(selectedImage);
      uploadImage(selectedImage);
    }
  };

  const uploadImage = async imageUri => {
    const formData = new FormData();
    formData.append('profileImage', {
      uri: imageUri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    });
    formData.append('id', userData?.id);
    formData.append(
      'name',
      userData?.businessname || userData?.person || 'Unknown',
    );

    try {
      const response = await axios.post(
        'https://signpostphonebook.in/image_upload_for_new_database.php',
        formData,
        {headers: {'Content-Type': 'multipart/form-data'}},
      );

      //   console.log("Upload Response:", response.data);

      if (response.data.success) {
        const fullUrl = response.data.imageUrl.startsWith('http')
          ? response.data.imageUrl
          : `https://signpostphonebook.in/${response.data.imageUrl}`;

        setProfileImage(fullUrl + `?t=${new Date().getTime()}`); // Prevent caching
        setUserData(prevData => ({...prevData, profileImage: fullUrl}));
      } else {
        console.error('Upload failed:', response.data.message);
        Alert.alert('Upload Failed', response.data.message);
      }
    } catch (error) {
      console.error('Error uploading image:', error.message);
      Alert.alert(
        'Upload Error',
        'An error occurred while uploading the image.',
      );
    }
  };

  const fetchUserData = async (userid, date, signal) => {
    try {
      if (!userid || !date) {
        throw new Error('Please provide a valid ID and Date.');
      }

      const response = await fetch(
        `https://signpostphonebook.in/data_entry_details.php?userid=${userid}&date=${date}`,
        {signal}, // Attach the abort signal
      );

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success' && data.data) {
        return data.data;
      } else if (
        data.status === 'error' &&
        data.message === 'No record found.'
      ) {
        return {count: 0}; // Ensure frontend handles missing data correctly
      } else {
        throw new Error(data.message || 'Failed to fetch details.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching user data:', error.message);
      }
      return null;
    }
  };

  useEffect(() => {
    if (!userData?.id || !date) {
      setError('Invalid user data or date.');
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const getData = async () => {
      setIsLoading(true);
      const data = await fetchUserData(userData.id, date, signal);
      setIsLoading(false);

      if (data) {
        setTaskCount(data.count || 0); // Ensure count is handled even if 0
        setError(null);
      } else {
        setError('No data found.');
        setTaskCount(0); // Reset count if no data is found
      }
    };

    getData();
    if (typeof fetchReferralCount === 'function') {
      fetchReferralCount();
    }

    return () => controller.abort(); // Cancel fetch request on unmount
  }, [userData, date]);

  // Fetch referral count
  const fetchReferralCount = async () => {
    if (!userData?.mobileno) return;
    try {
      const response = await fetch(
        `https://signpostphonebook.in/try_referrals_count.php?mobile=${encodeURIComponent(
          userData.mobileno,
        )}`,
      );
      const data = await response.text();
      const match = data.match(/Total Referred: (\d+)/);
      if (match) setReferralCount(parseInt(match[1], 10));
    } catch (error) {
      setError('Failed to fetch referral count.');
    }
  };

  // style={styles.profileImage}







  return (
    <View style={styles.container}>
    {/* Header Section */}
    <LinearGradient colors={['#FF69B4', '#FFFFFF']} style={styles.header}>
   

      {/* Profile Image */}
      <Image
        source={{ uri: profileImage }}
        style={styles.profileImage}
        resizeMode="contain"
      />
      <Text style={styles.userName}>{userData?.businessname || userData?.person || 'Your Name'}</Text>

      {/* Stats Section (Fixed Position) */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statsNumber}>{taskCount}</Text>
          <Text style={styles.statsText}>Total Count</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={styles.statsNumber}>{referralCount}</Text>
          <Text style={styles.statsText}>Referral Count</Text>
        </View>
      </View>
        </LinearGradient>

    {/* Contact Information */}
    <ScrollView style={styles.infoSection}>
      <View style={styles.infoRow}>
        <Icon name="envelope" size={20} color="#666" />
        <Text style={styles.infoText}>{userData.description || "Description"}</Text>
      </View>
      <View style={styles.infoRow}>
        <Icon name="cube" size={20} color="#666" />
        <Text style={styles.infoText}>{userData.product || "Product"}</Text>
      </View>
      <View style={styles.infoRow}>
        <Icon name="map-marker" size={20} color="#1DA1F2" />
        <Text style={styles.infoText}>
          {userData.address || "Address"}, {userData.city || "City"}, {userData.pincode || "Pincode"}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Icon name="phone" size={20} color="#1769FF" />
        <Text style={styles.infoText}>{userData.mobileno || "Mobile No"}</Text>
      </View>
      <View style={styles.infoRow}>
        <Icon name="envelope" size={20} color="#4267B2" />
        <Text style={styles.infoText}>{userData.email || "Email"}</Text>
      </View>
    </ScrollView>

    {/* Membership Card Button (Fixed Position) */}
    <View style={styles.fixedButtonContainer}>
      <TouchableOpacity style={styles.openModalButton} onPress={openMembershipModal}>
        <Text style={styles.buttonText}>Membership Card</Text>
      </TouchableOpacity>
    </View>

    {/* Membership Card Modal */}
    <Modal
          visible={membershipModalVisible}
          animationType="fade"
          transparent={true}
        >
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              {/* Header Section */}
              <View style={styles.modalheader}>
                <Image
                  source={require("../src/assets/images/Logo_Phonebook.jpg")}
                  style={styles.logo}
                />
                <Text style={styles.modalheaderText}>Membership Card</Text>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeMembershipModal}
                >
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </View>

              {/* Membership Card Content */}
              <Text style={styles.membershipText}></Text>
              <View style={styles.cardContent}>
                <Image
                  source={{ uri: profileImage }}
                  style={styles.memprofileImage}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {userData?.businessname || userData?.person}
                  </Text>
                   
                  <Text style={styles.addressText}>
                    Address: {userData?.address || "N/A"},{userData?.city || "N/A"}
                  </Text>
                  <Text style={styles.addressText}>
                    Pincode:  {userData?.pincode || "N/A"} 
                  </Text>
                </View>
              </View>

              {/* Footer Section */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  This card is valid for 12 Months from the date of issue.
                </Text>
                <Text style={styles.footerAddress}>
                  46, Sidco Industrial Estate, Coimbatore - 641021
                </Text>
              </View>
            </View>
          </View>
        </Modal>
  </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    backgroundColor: "#1E3CFF",
    alignItems: "center",
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backIcon: { position: "absolute", left: 20, top: 15 },
  settingsIcon: { position: "absolute", right: 20, top: 15 },
  profileImage: { width: 80, height: 80, borderRadius: 40, marginTop: 10, borderWidth: 2, borderColor: "#fff" },
  userName: { color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 10 },
  
  statsContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 10 },
  statBox: { alignItems: "center", paddingHorizontal: 20 },
  statsNumber: { fontSize: 18, fontWeight: "bold" },
  statsText: { fontSize: 14, },
  divider: { height: 30, width: 2, backgroundColor: "black", marginHorizontal: 10 },

  infoSection: { padding: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  infoText: { marginLeft: 15, fontSize: 16, },

  fixedButtonContainer: { position: "absolute", bottom: 20, alignSelf: "center" },
  openModalButton: { backgroundColor: "#ff4081", padding: 10, borderRadius: 5 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },

  
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
  },
  modalheader: {
    backgroundColor: "#ff4581",
    width: "100%",
    flexDirection: "row", // Arrange items in a row
    alignItems: "center", // Align items vertically
    justifyContent: "center", // Align items horizontally
    padding: 10,
  },

  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  modalheaderText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    bottom: 25,

    marginLeft: 10,
    marginBottom: -50,
  },
  membershipText: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 5,
  },
  cardContent: {
    marginRight: -105,
    flexDirection: "row",
    alignItems: "center",
    
  },
  memprofileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  validText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "gray",
    marginTop: 5,
  },
  addressText: {
    width: "70%",
    fontSize: 14,
    color: "gray",
    marginTop: 5,
    flexWrap: "wrap",
  },
  footer: {
    backgroundColor: "#ff4081",
    width: "100%",
    padding: 10,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "white",
  },
  footerAddress: {
    fontSize: 12,
    color: "white",
  },
  closeButton: {
    position: "absolute",
    right: 15,
    top: 15,
    backgroundColor: "white",
    width: 25,
    height: 25,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
export default Profile;
