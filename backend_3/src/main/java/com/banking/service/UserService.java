package com.banking.service;

import com.banking.entity.User;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Map<String, Object> getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("firstName", user.getFirstName());
        map.put("lastName", user.getLastName());
        map.put("email", user.getEmail());
        map.put("phone", user.getPhone());
        map.put("address", user.getAddress());
        map.put("pincode", user.getPincode());
        map.put("state", user.getState());
        map.put("nationalIdentification", user.getNationalIdentification());
        map.put("role", user.getRole().name());
        map.put("profileImage", user.getProfileImage());
        map.put("nomineeName", user.getNomineeName());
        map.put("nomineeRelation", user.getNomineeRelation());
        map.put("twoFactorEnabled", user.isTwoFactorEnabled());
        map.put("createdAt", user.getCreatedAt());
        return map;
    }

    public Map<String, Object> updateProfile(Long userId, Map<String, String> request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.containsKey("firstName")) user.setFirstName(request.get("firstName"));
        if (request.containsKey("lastName")) user.setLastName(request.get("lastName"));
        if (request.containsKey("phone")) user.setPhone(request.get("phone"));
        if (request.containsKey("address")) user.setAddress(request.get("address"));
        if (request.containsKey("pincode")) user.setPincode(request.get("pincode"));
        if (request.containsKey("state")) user.setState(request.get("state"));
        if (request.containsKey("nationalIdentification")) user.setNationalIdentification(request.get("nationalIdentification"));
        if (request.containsKey("profileImage")) user.setProfileImage(request.get("profileImage"));
        if (request.containsKey("nomineeName")) user.setNomineeName(request.get("nomineeName"));
        if (request.containsKey("nomineeRelation")) user.setNomineeRelation(request.get("nomineeRelation"));

        userRepository.save(user);
        return getProfile(userId);
    }

    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // Admin methods
    public List<Map<String, Object>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", u.getId());
            map.put("firstName", u.getFirstName());
            map.put("lastName", u.getLastName());
            map.put("email", u.getEmail());
            map.put("phone", u.getPhone());
            map.put("address", u.getAddress());
            map.put("pincode", u.getPincode());
            map.put("state", u.getState());
            map.put("nationalIdentification", u.getNationalIdentification());
            map.put("profileImage", u.getProfileImage());
            map.put("role", u.getRole().name());
            map.put("enabled", u.isEnabled());
            map.put("createdAt", u.getCreatedAt());
            result.add(map);
        }
        return result;
    }

    public void toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
    }
}
