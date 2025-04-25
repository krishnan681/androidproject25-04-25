import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Linking,
} from 'react-native';
import {AuthContext} from './AuthContext';

const BuyerInformation = () => {
  const {userData} = useContext(AuthContext);
  const [buyerId, setBuyerId] = useState('');
  const [buyerMobile, setBuyerMobile] = useState('');
  const [buyerList, setBuyerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [companies, setCompanies] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const userId = userData?.id || '';
  const userName = userData?.businessname || userData?.person || 'Guest';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'https://signpostphonebook.in/client_fetch_for_new_database.php',
        );
        const jsonResponse = await response.json();
        if (Array.isArray(jsonResponse)) {
          const sortedData = jsonResponse.sort((a, b) => b.id - a.id);
          setCompanies(sortedData);
        } else {
          Alert.alert('Error', 'Unexpected response from server.');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load data: ' + error.message);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (buyerId) {
      const match = companies.find(c => String(c.id) === String(buyerId));
      if (match) {
        setBuyerMobile(match.mobileno || '');
        setSelectedItem(match);
      } else {
        setBuyerMobile('');
        setSelectedItem(null);
      }
    } else {
      setBuyerMobile('');
      setSelectedItem(null);
    }
  }, [buyerId, companies]);

  useEffect(() => {
    if (selectedItem && userData) {
      const newMessage = `Dear ${
        selectedItem.businessname || selectedItem.person
      }, We refer to your Business Listing in Signpost PHONEBOOOK, Mobile App. We are intersted in your Products. Please send Details. Call me 
Regards ${userData.businessname || userData.person}
${userData.mobileno || userData.email}`;
      setMessage(newMessage);
    }
  }, [selectedItem]);

  const handleAddBuyer = async () => {
    if (!buyerId || !buyerMobile) {
      Alert.alert('Missing Info', 'Enter a valid Buyer ID first');
      return;
    }

    if (buyerList.some(item => item.buyerId === buyerId)) {
      Alert.alert('Duplicate', 'This Buyer ID is already added.');
      return;
    }

    // POST immediately
    setLoading(true);
    try {
      const response = await fetch(
        'https://signpostphonebook.in/icecream/information.php',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            user_id: userId,
            user_name: userName,
            buyer_id: buyerId,
            date: new Date().toISOString().slice(0, 10),
          }),
        },
      );
      const result = await response.json();
      if (!result.success) {
        Alert.alert('Insert Failed', result.message);
        setLoading(false);
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong: ' + error.message);
      setLoading(false);
      return;
    }

    // Add to list after successful POST
    const updatedList = [...buyerList, {buyerId, buyerMobile}];
    setBuyerList(updatedList);

    setBuyerId('');
    setBuyerMobile('');
    setLoading(false);
  };

  const handleRemoveBuyer = idToRemove => {
    const updatedList = buyerList.filter(b => b.buyerId !== idToRemove);
    setBuyerList(updatedList);
  };

  const handleSubmitAndSendSMS = () => {
    if (buyerList.length === 0) {
      Alert.alert('Error', 'Please add at least one Buyer ID');
      return;
    }

    const lastBuyer = buyerList[buyerList.length - 1];
    const smsUrl = `sms:${lastBuyer.buyerMobile}?body=${encodeURIComponent(
      message,
    )}`;

    Linking.openURL(smsUrl).catch(error => {
      Alert.alert('Error', 'Failed to send message: ' + error.message);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Buyer Information</Text>

      <TextInput
        style={styles.input}
        placeholder="Buyer ID"
        value={buyerId}
        onChangeText={setBuyerId}
        keyboardType="numeric"
      />

      <TouchableOpacity onPress={handleAddBuyer} style={styles.plusButton}>
        <Text style={styles.plusText}>＋</Text>
      </TouchableOpacity>

      {buyerList.length > 0 && (
        <FlatList
          data={buyerList}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <View style={styles.buyerRow}>
              <Text style={styles.buyerItem}>
                ID: {item.buyerId} | {item.buyerMobile}
              </Text>
              <TouchableOpacity
                onPress={() => handleRemoveBuyer(item.buyerId)}
                style={styles.removeButton}>
                <Text style={styles.removeText}>❌</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Text style={styles.messageHeading}>Message</Text>
      <TextInput
        style={styles.messageInput}
        placeholder="Edit your message here"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={4}
      />

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <Button
          title="Send SMS to Last Buyer"
          onPress={handleSubmitAndSendSMS}
          color="#aa336a"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
    marginHorizontal: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#aa336a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  plusButton: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#aa336a',
    borderRadius: 50,
    marginBottom: 12,
    alignSelf: 'center',
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  plusText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    alignItems: 'center',
    justifyContent: 'center',

  },
  buyerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  buyerItem: {
    fontSize: 16,
  },
  removeButton: {
    paddingHorizontal: 10,
  },
  removeText: {
    fontSize: 18,
    color: 'red',
  },
  messageHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
});

export default BuyerInformation;
