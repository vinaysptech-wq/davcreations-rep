module.exports = {
  apps: [
    {
      name: 'customer-frontend',
      cwd: '/var/www/dev.davcreation.in/davcreations-rep/davcreationcustomer-frontend',
      script: 'npm',
      args: 'start',
      env: { PORT: 3000, NODE_ENV: 'production' }
    },
    {
      name: 'admin-frontend',
      cwd: '/var/www/dev.davcreation.in/davcreations-rep/admin-frontend',
      script: 'npm',
      args: 'start',
      env: { PORT: 3001, NODE_ENV: 'production', NEXT_PUBLIC_BASE_PATH: '/admin-frontend' }
    },
    {
      name: 'superadmin-frontend',
      cwd: '/var/www/dev.davcreation.in/davcreations-rep/superadmin-frontend',
      script: 'npm',
      args: 'start',
      env: { PORT: 3002, NODE_ENV: 'production', NEXT_PUBLIC_BASE_PATH: '/superadmin-frontend' }
    }
  ]
};
