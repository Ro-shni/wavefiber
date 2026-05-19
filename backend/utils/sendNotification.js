import Notification from '../models/Notification.js';

/**
 * Creates a notification in the database and emits it via Socket.IO
 * 
 * @param {Object} req - The Express request object (used to get socket io instance)
 * @param {String} recipientId - The user ID to receive the notification
 * @param {String} title - Notification title
 * @param {String} message - Notification message body
 * @param {String} type - Notification type (e.g., 'SYSTEM', 'COMPLAINT_UPDATE')
 * @param {String} relatedId - Optional related entity ID (e.g., complaintId)
 */
export const sendNotification = async (req, recipientId, title, message, type = 'SYSTEM', relatedId = null) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      relatedId
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${recipientId}`).emit('new-notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
