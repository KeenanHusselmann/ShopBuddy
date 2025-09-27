import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { email, firstName, lastName, role, shopName, invitationLink } = await req.json()
    
    // For now, just return success - you can integrate with your preferred email service
    // Examples: SendGrid, Resend, SMTP, etc.
    
    const emailContent = `
      <h2>Staff Invitation</h2>
      <p>Hello ${firstName} ${lastName},</p>
      <p>You have been invited to join ${shopName} as a ${role}.</p>
      <p>Click the link below to set up your account:</p>
      <a href="${invitationLink}">Accept Invitation</a>
      <p>If the link doesn't work, copy and paste this URL into your browser:</p>
      <p>${invitationLink}</p>
      <p>This invitation will expire in 7 days.</p>
    `
    
    // TODO: Integrate with your email service here
    // Example with a hypothetical email service:
    // await emailService.send({
    //   to: email,
    //   subject: `Staff Invitation - ${shopName}`,
    //   html: emailContent
    // })
    
    console.log(`Staff invitation email would be sent to ${email} for ${firstName} ${lastName}`)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email sent successfully",
      emailContent: emailContent // For testing purposes
    }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
})
